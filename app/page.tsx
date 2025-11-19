import { getUserSessionOnServer } from "@/lib/session";
import { createSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

// Force dynamic rendering since we're using cookies and server-side data fetching
export const dynamic = 'force-dynamic';

// Error display component
function ErrorDisplay({ error, errorMessage }: { error?: string; errorMessage?: string }) {
  if (!error && !errorMessage) return null;
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <p className="font-semibold mb-1">Something went wrong</p>
      <p className="text-red-300/80">
        {error && <span>{error}: </span>}
        {errorMessage ? decodeURIComponent(errorMessage) : 'An error occurred'}
      </p>
    </div>
  );
}

// Top bar component
function TopBar() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-slate-50">CollabTOK</span>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Sandbox</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/api/auth/tiktok"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          Reconnect TikTok
        </Link>
      </div>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: { error?: string; details?: string; errorMessage?: string };
}) {
  try {
    // Extract error messages from searchParams
    const error = searchParams?.error;
    const errorMessage = searchParams?.details || searchParams?.errorMessage;

    // Get session with error handling
    let session = null;
    try {
      session = await getUserSessionOnServer();
    } catch (error) {
      console.error('Error getting session:', error);
      session = null;
    }

    // If no session, show connect screen
    if (!session?.userId) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <ErrorDisplay error={error} errorMessage={errorMessage} />
            
            <section className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-xl">
                📊
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-50">
                  Connect your TikTok
                </h1>
                <p className="text-slate-400 max-w-md">
                  View your TikTok profile, track your statistics, and get simple analytics for your content.
                </p>
              </div>
              
              <Link
                href="/api/auth/tiktok"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 transition"
              >
                Sign in with TikTok
              </Link>
              
              <p className="text-xs text-slate-500 mt-4">
                Sandbox mode – only whitelisted accounts can connect.
              </p>
            </section>
          </div>
        </main>
      );
    }

    // Fetch user profile and stats from Supabase
    let profile = null;
    let profileError = null;
    let stats = null;
    let statsError = null;
    
    try {
      const supabase = createSupabaseClient();

      // Get profile for this user
      const profileResult = await supabase
        .from("tiktok_profiles")
        .select("*")
        .eq("user_id", session.userId)
        .maybeSingle();
      
      profile = profileResult.data;
      profileError = profileResult.error;

      // Get most recent stats snapshot
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
        <main className="min-h-screen bg-slate-950 text-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <TopBar />
            <ErrorDisplay error={error} errorMessage={errorMessage} />
            
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-50">
                Syncing your TikTok data
              </h2>
              <p className="text-slate-400">
                It may take a moment to sync your profile and statistics. If this persists, try reconnecting your TikTok account.
              </p>
              <Link
                href="/api/auth/tiktok"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                Reconnect TikTok
              </Link>
            </div>
          </div>
        </main>
      );
    }

    // Map database fields to the expected format
    const displayName = profile.tiktok_display_name || null;
    const username = profile.tiktok_username || null;
    const avatarUrl = profile.profile_picture_url || null;
    const bio = profile.bio || null;
    const isVerified = profile.verified || false;
    // Construct profile link from username (since profile_link doesn't exist in schema)
    const profileLink = username ? `https://www.tiktok.com/@${username}` : null;

    // Map stats fields
    const followers = stats?.follower_count ?? 0;
    const following = stats?.following_count ?? 0;
    const likes = stats?.total_likes ?? 0;
    const videos = stats?.video_count ?? profile?.video_count ?? 0;
    const snapshotAt = stats?.recorded_at || null;

    // Display dashboard with profile and stats
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <TopBar />
          <ErrorDisplay error={error} errorMessage={errorMessage} />
          
          {/* Intro Section */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-50">Creator dashboard</h1>
            <p className="text-slate-400 text-sm">
              Overview of your TikTok profile and performance.
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Profile Card */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-sm hover:border-slate-700 transition">
                {/* Avatar */}
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName || username || "Profile"}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-400 font-semibold text-lg">
                      {username ? username.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                )}
                
                {/* Display Name */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-1">
                    {displayName || username || "Unknown User"}
                  </h3>
                  {username && (
                    <p className="text-sm text-slate-400">@{username}</p>
                  )}
                </div>
                
                {/* Verified Badge */}
                {isVerified && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300 border border-emerald-500/40">
                    <span>✓</span>
                    <span>Verified</span>
                  </div>
                )}
                
                {/* Bio */}
                {bio && (
                  <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
                )}
                
                {/* View on TikTok Link */}
                {profileLink && (
                  <a
                    href={profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  >
                    View on TikTok →
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Stats + Activity */}
            <div className="space-y-6 lg:col-span-2">
              {/* Stats Cards Row */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 hover:border-slate-700 hover:bg-slate-900 transition hover:scale-[1.01] hover:shadow-md">
                  <div className="text-xs text-slate-400">Followers</div>
                  <div className="text-2xl font-semibold text-slate-50">
                    {followers.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Current total</div>
                </div>
                
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 hover:border-slate-700 hover:bg-slate-900 transition hover:scale-[1.01] hover:shadow-md">
                  <div className="text-xs text-slate-400">Likes</div>
                  <div className="text-2xl font-semibold text-slate-50">
                    {likes.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Current total</div>
                </div>
                
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 hover:border-slate-700 hover:bg-slate-900 transition hover:scale-[1.01] hover:shadow-md">
                  <div className="text-xs text-slate-400">Following</div>
                  <div className="text-2xl font-semibold text-slate-50">
                    {following.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Current total</div>
                </div>
                
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 hover:border-slate-700 hover:bg-slate-900 transition hover:scale-[1.01] hover:shadow-md">
                  <div className="text-xs text-slate-400">Videos</div>
                  <div className="text-2xl font-semibold text-slate-50">
                    {videos.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Current total</div>
                </div>
              </div>

              {/* Recent Activity / Placeholder */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-50">Recent activity</h3>
                <p className="text-sm text-slate-400">
                  Coming soon: video analytics and detailed performance metrics.
                </p>
                {snapshotAt && (
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500">
                      Last sync: {new Date(snapshotAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    // Fallback error UI - always render something
    console.error('Page render error:', error);
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p className="font-semibold mb-1">Page Error</p>
            <p className="text-red-300/80">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <h1 className="text-3xl font-semibold text-slate-50">Something went wrong</h1>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              Reload Page
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
