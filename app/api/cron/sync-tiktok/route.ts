import { NextRequest, NextResponse } from "next/server";
import { syncAllTikTokUsers } from "@/lib/tiktok-sync";

/**
 * Cron job endpoint to sync TikTok data for all users
 * 
 * This endpoint should be called periodically (e.g., every hour) to automatically
 * update user stats, profiles, and videos.
 * 
 * To set up in Vercel:
 * 1. Add this to vercel.json cron configuration
 * 2. Or use Vercel Cron Jobs in the dashboard
 * 
 * Security: Add a secret header check to prevent unauthorized access
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Optional: Add security check for cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting TikTok sync for all users...");

    const result = await syncAllTikTokUsers();

    console.log("TikTok sync completed:", result);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

