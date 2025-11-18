import { NextResponse } from "next/server";
import { buildTikTokAuthUrl } from "@/lib/tiktok";

/**
 * TikTok OAuth login start route
 * 
 * Redirects the user to TikTok's authorization page.
 * 
 * Usage: Link to /api/auth/tiktok from your UI (e.g., "Connect TikTok" button)
 * 
 * Environment variables required:
 * - TIKTOK_CLIENT_KEY
 * - TIKTOK_REDIRECT_URI (e.g., http://localhost:3000/api/auth/tiktok/callback)
 */
export async function GET() {
  try {
    // TODO: Generate and store state in a cookie for CSRF protection
    // The state should be validated in the callback route
    // const state = crypto.randomUUID();
    // Set state cookie here if needed

    const authUrl = buildTikTokAuthUrl();

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("TikTok OAuth error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to initiate TikTok login";

    // Return a user-friendly error page or redirect
    return NextResponse.json(
      {
        error: errorMessage,
        details:
          "Please check that TIKTOK_CLIENT_KEY and TIKTOK_REDIRECT_URI are set in your .env.local file",
      },
      { status: 500 }
    );
  }
}

