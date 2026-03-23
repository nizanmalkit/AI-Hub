import { NextResponse } from "next/server";
import { adminDb as db } from "@/utils/firebase/admin";
import * as admin from "firebase-admin";
// @ts-ignore - Ignore missing types during compile if any
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Set timeout limit for Vercel to 60 seconds


const parser = new Parser();

export async function POST(request: Request) {
  try {
    console.log("Next.js /api/sync triggered");

    console.log("Next.js /api/sync triggered - Dispatching to GitHub Actions");

    const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const owner = "nizanmalkit";
    const repo = "AI-Hub";
    const workflowId = "sync.yml";

    if (!githubToken) {
      console.error("❌ GITHUB_TOKEN is not set in Next.js environment variables.");
      const loadedKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes("git") || k.toLowerCase().includes("token"));
      
      return NextResponse.json({ 
        status: "error", 
        message: `GITHUB_TOKEN is not set on Vercel. Available related keys found: [${loadedKeys.join(", ")}]. Please confirm the Exact name matches GITHUB_TOKEN perfectly.` 
      }, { status: 500 });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Vercel-AI-Hub"
        },
        body: JSON.stringify({
          ref: "master"
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ GitHub Dispatch Failed:", errorText);
      return NextResponse.json({ 
        status: "error", 
        message: `GitHub Trigger Failed: ${errorText}` 
      }, { status: response.status });
    }

    return NextResponse.json({ 
      status: "success", 
      message: "Sync triggered perfectly via GitHub Actions in the background! It may take 1-2 minutes for new items to appear on the site." 
    });

  } catch (error) {
    console.error("Sync API Logic Error", error);
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
