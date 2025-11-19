import { NextRequest, NextResponse } from "next/server";
import { getUserSessionOnServer } from "@/lib/session";
import { syncTikTokUserData } from "@/lib/tiktok-sync";

export const dynamic = 'force-dynamic';

/**
 * Manual refresh endpoint for syncing TikTok data
 * User can call this to immediately sync their data
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSessionOnServer();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    console.log(`Manual refresh requested for user: ${session.userId}`);

    const result = await syncTikTokUserData(session.userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Data refreshed successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to refresh data",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

