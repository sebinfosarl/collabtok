/**
 * TikTok OAuth v2 (Login Kit for Web) utilities
 */

export const TIKTOK_AUTHORIZE_ENDPOINT = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";
export const TIKTOK_USER_INFO_ENDPOINT = "https://open.tiktokapis.com/v2/user/info/";

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

  // Build scope string (comma-separated for TikTok API)
  // TikTok Login Kit requires comma-separated scopes
  const scope = TIKTOK_SCOPES.join(",");

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

/**
 * TikTok token response type
 */
export interface TikTokTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope: string;
  open_id: string;
}

/**
 * TikTok user info response type
 */
export interface TikTokUserInfo {
  open_id: string;
  avatar_url?: string;
  display_name?: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  username?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

/**
 * Exchanges an authorization code for an access token
 * 
 * @param code - The authorization code from TikTok
 * @param codeVerifier - Optional PKCE code verifier (if using PKCE)
 * @returns Token response including access_token and open_id
 * @throws Error if token exchange fails
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier?: string
): Promise<TikTokTokenResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey) {
    throw new Error("TIKTOK_CLIENT_KEY environment variable is required");
  }

  if (!clientSecret) {
    throw new Error("TIKTOK_CLIENT_SECRET environment variable is required");
  }

  if (!redirectUri) {
    throw new Error("TIKTOK_REDIRECT_URI environment variable is required");
  }

  const body: Record<string, string> = {
    client_key: clientKey,
    client_secret: clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };

  // Add PKCE code verifier if provided
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(TIKTOK_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("TikTok token exchange error:", errorText);
    throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Check for TikTok API error response
  if (data.error) {
    throw new Error(`TikTok API error: ${data.error_description || data.error}`);
  }

  return data as TikTokTokenResponse;
}

/**
 * Fetches TikTok user information using an access token
 * 
 * @param accessToken - The access token from TikTok
 * @returns User information including profile and stats
 * @throws Error if fetching user info fails
 */
export async function fetchTikTokUserInfo(
  accessToken: string
): Promise<TikTokUserInfo> {
  const response = await fetch(
    `${TIKTOK_USER_INFO_ENDPOINT}?fields=open_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,username,follower_count,following_count,likes_count,video_count`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("TikTok user info error:", errorText);
    throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Check for TikTok API error response
  if (data.error) {
    throw new Error(`TikTok API error: ${data.error_description || data.error}`);
  }

  // TikTok API returns data in a nested structure
  const userData = data.data?.user || data;
  
  return {
    open_id: userData.open_id,
    avatar_url: userData.avatar_url,
    display_name: userData.display_name,
    bio_description: userData.bio_description,
    profile_deep_link: userData.profile_deep_link,
    is_verified: userData.is_verified,
    username: userData.username,
    follower_count: userData.follower_count,
    following_count: userData.following_count,
    likes_count: userData.likes_count,
    video_count: userData.video_count,
  };
}

