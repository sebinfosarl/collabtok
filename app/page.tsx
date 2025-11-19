import { getUserSessionOnServer } from "@/lib/session";
import { createSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { RefreshButton } from "@/components/RefreshButton";

// Force dynamic rendering since we're using cookies and server-side data fetching
export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: { error?: string; details?: string };
}) {
  let session;
  try {
    session = await getUserSessionOnServer();
  } catch (error) {
    console.error('Error getting session:', error);
    // If session check fails, treat as no session
    session = null;
  }

  // If no session, show connect screen
  if (!session?.userId) {
    const error = searchParams?.error;
    const errorDetails = searchParams?.details;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect your TikTok</h1>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">Error: {error}</p>
              {errorDetails && (
                <p className="text-red-600 text-sm">{decodeURIComponent(errorDetails)}</p>
              )}
            </div>
          )}
          <p className="text-gray-600 mb-6">
            Sign in with TikTok to view your profile and statistics
          </p>
          <Link
            href="/api/auth/tiktok"
            className="inline-block px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Connect TikTok
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user profile and stats from Supabase
  let profile, profileError, stats, statsError;
  
  try {
    const supabase = createSupabaseClient();

    const profileResult = await supabase
      .from("tiktok_profiles")
      .select("*")
      .eq("user_id", session.userId)
      .maybeSingle();
    
    profile = profileResult.data;
    profileError = profileResult.error;

    const statsResult = await supabase
      .from("tiktok_stats")
      .select("*")
      .eq("user_id", session.userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    stats = statsResult.data;
    statsError = statsResult.error;
  } catch (error) {
    console.error('Error fetching profile/stats:', error);
    profileError = error instanceof Error ? error : new Error('Unknown error');
  }

  // If profile or stats not found, show sync message
  if (profileError || statsError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            We&apos;re syncing your TikTok data
          </h1>
          <p className="text-gray-600 mb-6">
            Please reconnect if this persists.
          </p>
          <Link
            href="/api/auth/tiktok"
            className="inline-block px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Reconnect TikTok
          </Link>
        </div>
      </div>
    );
  }

  // Display dashboard with profile and stats
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-6">
            {profile.profile_picture_url && (
              <Image
                src={profile.profile_picture_url}
                alt={profile.tiktok_display_name || profile.tiktok_username}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.tiktok_display_name || profile.tiktok_username}
                </h1>
                {profile.verified && (
                  <span className="text-blue-500" title="Verified">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg mb-2">@{profile.tiktok_username}</p>
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}
              <a
                href={`https://www.tiktok.com/@${profile.tiktok_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View on TikTok →
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.follower_count?.toLocaleString() || 0}
            </div>
            <div className="text-gray-600 font-medium">Followers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.following_count?.toLocaleString() || 0}
            </div>
            <div className="text-gray-600 font-medium">Following</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.total_likes?.toLocaleString() || 0}
            </div>
            <div className="text-gray-600 font-medium">Likes</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {(stats?.video_count ?? profile?.video_count ?? 0).toLocaleString()}
            </div>
            <div className="text-gray-600 font-medium">Videos</div>
          </div>
        </div>

        {/* Refresh Button and Stats timestamp */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <RefreshButton />
          {stats?.recorded_at && (
            <div className="text-center text-sm text-gray-500">
              Last updated: {new Date(stats.recorded_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

