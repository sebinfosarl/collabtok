/**
 * TikTok OAuth v2 (Login Kit for Web) utilities
 */

export const TIKTOK_AUTHORIZE_ENDPOINT = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";
// TikTok API v2 user info endpoint
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
export type TikTokUserInfo = {
  open_id: string;
  avatar_url: string | null;
  display_name: string | null;
  bio_description: string | null;
  profile_deep_link: string | null;
  is_verified: boolean | null;
  username: string | null;
  follower_count: number | null;
  following_count: number | null;
  likes_count: number | null;
  video_count: number | null;
};

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
    let errorData: any = null;
    try {
      const errorText = await response.text();
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
    } catch (e) {
      errorData = { message: "Could not read error response" };
    }
    
    const relevantPart = errorData.error || errorData.error_description || errorData.message || errorData;
    throw new Error("TikTok token error: " + JSON.stringify(relevantPart));
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    const text = await response.text();
    throw new Error("TikTok token error: " + JSON.stringify({ message: "Invalid JSON response", text: text.substring(0, 200) }));
  }
  
  // Check for TikTok API error response
  // Note: TikTok returns { error: { code: "ok" } } for successful requests
  if (data.error) {
    const errorCode = data.error?.code || data.error_code;
    
    // If error code is "ok", it's actually a success response
    if (errorCode === "ok") {
      // This is a successful response, continue processing
      console.log("TikTok API success response with error.code='ok'");
    } else {
      // This is a real error
      const relevantPart = data.error || { code: errorCode, message: data.error_description || "Unknown error" };
      throw new Error("TikTok token error: " + JSON.stringify(relevantPart));
    }
  }

  // Validate required fields
  if (!data.access_token || !data.open_id) {
    console.error("TikTok token response missing required fields:", data);
    throw new Error("TikTok token response missing access_token or open_id");
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
  // TikTok API v2 uses GET with fields in query parameters
  const fields = [
    "open_id",
    "avatar_url",
    "display_name",
    "bio_description",
    "profile_deep_link",
    "is_verified",
    "username",
    "follower_count",
    "following_count",
    "likes_count",
    "video_count",
  ].join(",");

  const url = `${TIKTOK_USER_INFO_ENDPOINT}?fields=${encodeURIComponent(fields)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      const errorText = await response.text();
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
    } catch (e) {
      errorData = { message: "Could not read error response" };
    }
    
    const relevantPart = errorData.error || errorData.error_description || errorData.message || errorData;
    throw new Error("TikTok user info error: " + JSON.stringify(relevantPart));
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    const text = await response.text();
    throw new Error("TikTok user info error: " + JSON.stringify({ message: "Invalid JSON response", text: text.substring(0, 200) }));
  }
  
  // Check for TikTok API error response
  // Note: TikTok returns { error: { code: "ok" } } for successful requests
  if (data.error) {
    const errorCode = data.error?.code || data.error_code;
    
    // If error code is "ok", it's actually a success response
    if (errorCode === "ok") {
      // This is a successful response, continue processing
      console.log("TikTok API success response with error.code='ok'");
    } else {
      // This is a real error
      const relevantPart = data.error || { code: errorCode, message: data.error_description || "Unknown error" };
      throw new Error("TikTok user info error: " + JSON.stringify(relevantPart));
    }
  }

  // TikTok API v2 returns data in a nested structure: { data: { user: {...} } }
  const userData = data.data?.user || data.data || data;
  
  if (!userData || !userData.open_id) {
    console.error("TikTok user info response missing user data:", JSON.stringify(data, null, 2));
    throw new Error("TikTok user info response missing user data or open_id");
  }
  
  return {
    open_id: userData.open_id,
    avatar_url: userData.avatar_url ?? null,
    display_name: userData.display_name ?? null,
    bio_description: userData.bio_description ?? null,
    profile_deep_link: userData.profile_deep_link ?? null,
    is_verified: userData.is_verified ?? null,
    username: userData.username ?? null,
    follower_count: userData.follower_count ?? null,
    following_count: userData.following_count ?? null,
    likes_count: userData.likes_count ?? null,
    video_count: userData.video_count ?? null,
  };
}

