import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchTikTokUserInfo } from "@/lib/tiktok";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { setUserSession } from "@/lib/session";

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

// Force dynamic rendering for this route (OAuth callback must be dynamic)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Log the callback for debugging
    console.log("TikTok callback received", { code: code ? "present" : "missing", state });

    // If code is missing, redirect to home with error
    if (!code) {
      console.error("TikTok callback missing authorization code");
      return NextResponse.redirect(new URL("/?error=missing_code", req.url));
    }

    // Read PKCE verifier from cookie (optional - only if PKCE is implemented)
    const pkceVerifier = req.cookies.get("collabtok_pkce_verifier")?.value;
    
    // Note: PKCE is optional for now. If you implement PKCE, uncomment the check below:
    // if (!pkceVerifier) {
    //   return NextResponse.redirect(new URL("/?error=missing_pkce", req.url));
    // }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, pkceVerifier);
    const { access_token, open_id, refresh_token, expires_in, scope, token_type } = tokenResponse;

    // Fetch user info from TikTok API
    const userInfo = await fetchTikTokUserInfo(access_token);

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Find or create user in users table
    // Note: The users table needs a tiktok_open_id column. If it doesn't exist,
    // you'll need to add it: ALTER TABLE users ADD COLUMN tiktok_open_id TEXT UNIQUE;
    let userId: string;

    // Try to find existing user by tiktok_open_id
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("tiktok_open_id", open_id)
      .maybeSingle();

    if (userError && userError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine, other errors are real problems
      console.error("Error checking for existing user:", userError);
      throw new Error(`Failed to check for existing user: ${userError.message}`);
    }

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      // Note: email is required in the schema, but we don't have it from TikTok
      // We'll use a placeholder or make email nullable. For now, using open_id as email placeholder.
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          tiktok_open_id: open_id,
          email: `${open_id}@tiktok.local`, // Placeholder email
          username: userInfo.username || undefined,
          full_name: userInfo.display_name || undefined,
          avatar_url: userInfo.avatar_url || undefined,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating user:", insertError);
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      if (!newUser) {
        console.error("Failed to create user - no data returned");
        throw new Error("Failed to create user - no data returned");
      }

      userId = newUser.id;
    }

    // Upsert TikTok profile
    const { error: profileError } = await supabase
      .from("tiktok_profiles")
      .upsert(
        {
          user_id: userId,
          tiktok_username: userInfo.username || "",
          tiktok_display_name: userInfo.display_name || null,
          profile_picture_url: userInfo.avatar_url || null,
          bio: userInfo.bio_description || null,
          verified: userInfo.is_verified ?? false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (profileError) {
      console.error("Error upserting TikTok profile:", profileError);
      throw new Error(`Failed to save TikTok profile: ${profileError.message}`);
    }

    // Insert new stats snapshot
    const { error: statsError } = await supabase
      .from("tiktok_stats")
      .insert({
        user_id: userId,
        follower_count: userInfo.follower_count ?? 0,
        following_count: userInfo.following_count ?? 0,
        video_count: userInfo.video_count ?? 0,
        total_likes: userInfo.likes_count ?? 0,
        recorded_at: new Date().toISOString(),
      });

    if (statsError) {
      console.error("Error inserting TikTok stats:", statsError);
      throw new Error(`Failed to save TikTok stats: ${statsError.message}`);
    }

    // Store access token for automatic syncing
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    const { error: tokenError } = await supabase
      .from("tiktok_tokens")
      .upsert(
        {
          user_id: userId,
          access_token: access_token,
          refresh_token: refresh_token || null,
          expires_at: expiresAt,
          token_type: token_type || "Bearer",
          scope: scope || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (tokenError) {
      console.error("Error storing TikTok token:", tokenError);
      // Don't fail the whole flow if token storage fails, but log it
    }

    // Create redirect response
    const response = NextResponse.redirect(new URL("/", req.url));

    // Set user session cookie
    setUserSession(userId, response);

    // Clear PKCE cookie if it exists
    if (pkceVerifier) {
      response.cookies.set("collabtok_pkce_verifier", "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error("TikTok callback error", error);
    
    // Extract a readable error message
    const errorMessage =
      error instanceof Error
        ? error.message
        : JSON.stringify(error);

    // Redirect to home with error
    return NextResponse.redirect(
      new URL(`/?error=tiktok_callback_failed&errorMessage=${encodeURIComponent(errorMessage)}`, req.url)
    );
  }
}

