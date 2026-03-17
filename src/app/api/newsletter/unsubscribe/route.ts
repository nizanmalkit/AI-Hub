import { NextResponse } from "next/server";
import { adminDb as db } from "@/utils/firebase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return new NextResponse(
        "<h1>Error</h1><p>Invalid unsubscribe link. Missing identifier.</p>",
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Update flat users/{uid} document
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return new NextResponse(
        "<h1>Error</h1><p>User profile not found.</p>",
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    await userRef.update({
      emailNotifications: false,
      updated_at: new Date()
    });

    // 📜 Log Audit Trail for Compliance
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await db.collection("audit_logs").add({
      userId: uid,
      email: userSnap.data()?.email || "unknown",
      action: "unsubscribed",
      timestamp: new Date(),
      source: "email_footer",
      ip: ip.split(',')[0].trim() // Handle proxies
    });

    return new NextResponse(
      `
      <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #1e293b;">
        <h1 style="color: #4f46e5; margin-bottom: 8px;">Success</h1>
        <p style="margin: 0; font-size: 16px;">You have been successfully unsubscribed from the daily newsletter.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">You can always enable it again in your settings.</p>
      </div>
      `,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (error) {
    console.error("Unsubscribe API Error:", error);
    return new NextResponse(
      "<h1>Error</h1><p>Something went wrong processing your request.</p>",
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
