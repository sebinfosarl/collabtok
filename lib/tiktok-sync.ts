/**
 * TikTok data synchronization utilities
 * Used for automatically syncing user data, stats, and videos
 */

import { createSupabaseClient } from "./supabaseClient";
import { fetchTikTokUserInfo } from "./tiktok";

/**
 * Syncs TikTok data for a specific user
 * Fetches latest profile, stats, and videos from TikTok API
 */
export async function syncTikTokUserData(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createSupabaseClient();

    // Get stored access token
    const { data: tokenData, error: tokenError } = await supabase
      .from("tiktok_tokens")
      .select("access_token, expires_at")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      return {
        success: false,
        error: `No access token found for user: ${tokenError?.message || "Token not found"}`,
      };
    }

    // Check if token is expired (with 5 minute buffer)
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const buffer = 5 * 60 * 1000; // 5 minutes

      if (expiresAt.getTime() - now.getTime() < buffer) {
        // Token expired or about to expire
        // TODO: Implement token refresh logic
        return {
          success: false,
          error: "Access token expired. User needs to reconnect.",
        };
      }
    }

    // Fetch latest user info from TikTok
    const userInfo = await fetchTikTokUserInfo(tokenData.access_token);

    // Update profile
    const { error: profileError } = await supabase
      .from("tiktok_profiles")
      .upsert(
        {
          user_id: userId,
          tiktok_username: userInfo.username || "",
          tiktok_display_name: userInfo.display_name || null,
          profile_picture_url: userInfo.avatar_url || null,
          bio: userInfo.bio_description || null,
          verified: userInfo.is_verified || false,
          follower_count: userInfo.follower_count || 0,
          following_count: userInfo.following_count || 0,
          video_count: userInfo.video_count || 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return {
        success: false,
        error: `Failed to update profile: ${profileError.message}`,
      };
    }

    // Insert new stats snapshot
    const { error: statsError } = await supabase
      .from("tiktok_stats")
      .insert({
        user_id: userId,
        follower_count: userInfo.follower_count || 0,
        following_count: userInfo.following_count || 0,
        video_count: userInfo.video_count || 0,
        total_likes: userInfo.likes_count || 0,
        recorded_at: new Date().toISOString(),
      });

    if (statsError) {
      console.error("Error inserting stats:", statsError);
      return {
        success: false,
        error: `Failed to insert stats: ${statsError.message}`,
      };
    }

    // TODO: Fetch and sync videos if TikTok API supports it
    // This would require additional API endpoints and scopes

    return { success: true };
  } catch (error) {
    console.error("Error syncing TikTok user data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Syncs TikTok data for all users
 * Used by cron job to periodically update all users' data
 */
export async function syncAllTikTokUsers(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  try {
    const supabase = createSupabaseClient();

    // Get all users with TikTok tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("tiktok_tokens")
      .select("user_id");

    if (tokensError || !tokens) {
      return {
        synced: 0,
        failed: 0,
        errors: [`Failed to fetch tokens: ${tokensError?.message || "Unknown error"}`],
      };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync each user
    for (const token of tokens) {
      const result = await syncTikTokUserData(token.user_id);
      if (result.success) {
        synced++;
      } else {
        failed++;
        errors.push(`User ${token.user_id}: ${result.error || "Unknown error"}`);
      }
    }

    return { synced, failed, errors };
  } catch (error) {
    console.error("Error syncing all TikTok users:", error);
    return {
      synced: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

