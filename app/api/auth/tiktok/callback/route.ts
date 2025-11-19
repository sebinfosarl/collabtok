import { NextRequest, NextResponse } from "next/server";

/**
 * TikTok OAuth callback route
 * 
 * Handles the redirect from TikTok after user authorization.
 * TikTok redirects to: /api/auth/tiktok/callback?code=...&state=...&scopes=...
 * 
 * Environment variables required:
 * - TIKTOK_CLIENT_KEY
 * - TIKTOK_CLIENT_SECRET (for token exchange)
 * - TIKTOK_REDIRECT_URI
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const scopes = searchParams.get("scopes");

    // Log the callback for debugging
    console.log("TikTok callback received", { code: code ? "present" : "missing", state, scopes });

    // If code is missing, redirect to home with error
    if (!code) {
      console.error("TikTok callback missing authorization code");
      return NextResponse.redirect(new URL("/?error=missing_code", req.url));
    }

    // TODO: Validate state parameter (CSRF protection)
    // TODO: Exchange authorization code for access token
    // TODO: Fetch user info from TikTok API
    // TODO: Create or update user in database
    // TODO: Set user session cookie

    // For now, redirect to home page
    // The code is logged above for debugging
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("TikTok callback error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process TikTok callback";

    // Redirect to home with error
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorMessage)}`, req.url)
    );
  }
}

