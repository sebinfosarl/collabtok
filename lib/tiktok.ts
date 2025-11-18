/**
 * TikTok OAuth v2 (Login Kit for Web) utilities
 */

export const TIKTOK_AUTHORIZE_ENDPOINT = "https://www.tiktok.com/v2/auth/authorize/";

/**
 * Required scopes for TikTok OAuth
 */
const TIKTOK_SCOPES = [
  "user.info.basic",
  "user.info.profile",
  "user.info.stats",
];

/**
 * Builds the TikTok OAuth authorization URL
 * 
 * @param state - Optional state parameter for CSRF protection. If not provided, generates a random UUID.
 * @returns The complete TikTok authorization URL
 * @throws Error if required environment variables are missing
 */
export function buildTikTokAuthUrl(state?: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey) {
    throw new Error("TIKTOK_CLIENT_KEY environment variable is required");
  }

  if (!redirectUri) {
    throw new Error("TIKTOK_REDIRECT_URI environment variable is required");
  }

  // Generate state if not provided
  const stateParam = state || crypto.randomUUID();

  // Build scope string (space-separated)
  const scope = TIKTOK_SCOPES.join(" ");

  // Build URL with query parameters
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scope,
    response_type: "code",
    redirect_uri: redirectUri,
    state: stateParam,
  });

  return `${TIKTOK_AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

