import { NextResponse } from "next/server";
import { adminDb as db } from "@/utils/firebase/admin";
import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";
import { NewsletterTemplate } from "@/components/emails/NewsletterTemplate";
import { render } from "@react-email/components";
import * as React from "react";

export const maxDuration = 60; // Set timeout limit for Vercel to 60 seconds


export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json({ status: "error", message: "RESEND_API_KEY is not set." }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

    // 1. Fetch Subscribers from flat users root collection
    const activeSubscribersSnap = await db.collection("users")
      .where("emailNotifications", "==", true)
      .get();

    const activeSubscribers = activeSubscribersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ status: "success", message: "No active subscribers found." });
    }

    // 2. Fetch Latest 5 Posts from Last 24 Hours
    const now = Date.now();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const postsSnap = await db.collection("posts")
      .orderBy("published_at", "desc")
      .where("published_at", ">=", twentyFourHoursAgo)
      .limit(5)
      .get();

    const basePosts = postsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    if (basePosts.length === 0) {
      return NextResponse.json({ status: "success", message: "No new posts to email today." });
    }

    let successCount = 0;

    // 3. Loop Subscribers and Send
    for (const subscriber of activeSubscribers) {
      const email = subscriber.email;
      const language = subscriber.language || "en";

      if (!email) continue;

      let emailPosts = [...basePosts];

      // 4. Translate on-the-fly if preferred language is Hebrew
      if (language === "he" && ai) {
        try {
          const prompt = `
          Translate the following list of AI posts into Hebrew for a newsletter.
          Keep it highly readable, strictly respecting Right-To-Left sentence flows.
          Maintain the exact fields layout structure.
          
          Input:
          ${JSON.stringify(basePosts, null, 2)}
          `;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });

          if (aiResponse.text) {
            emailPosts = JSON.parse(aiResponse.text);
          }
        } catch (translationError) {
          console.error(`Translation failed for ${email}, sending EN fallback:`, translationError);
        }
      }

      // 5. Render Template
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const emailHtml = await render(
        React.createElement(NewsletterTemplate, { 
          posts: emailPosts, 
          language,
          uid: subscriber.id,
          baseUrl
        })
      );

      // 6. Send via Resend
      const { data, error } = await resend.emails.send({
        from: "AI Hub <onboarding@resend.dev>", // Resend Sandbox Sender allows sending to account owner
        to: [email],
        subject: language === "he" ? "🗞️ עדכון ה-AI היומי שלך" : "🗞️ Your Daily AI Update",
        html: emailHtml,
      });

      if (error) {
        console.error(`Failed to email ${email}:`, error);
      } else {
        successCount++;
      }
    }

    return NextResponse.json({ 
      status: "success", 
      message: `Successfully processed newsletters for ${successCount} subscribers.` 
    });

  } catch (error) {
    console.error("Newsletter Cron Error:", error);
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
