import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "collabtok_user_id";

/**
 * Gets the current user session from the cookie.
 * Can be used in server components and route handlers.
 * 
 * @returns Promise resolving to { userId: string } if session exists, null otherwise
 */
export async function getUserSessionOnServer(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) {
    return null;
  }

  return { userId };
}

/**
 * Sets the user session cookie.
 * To be used in route handlers (e.g., TikTok callback route).
 * 
 * @param userId - The user ID to store in the session
 * @param res - The NextResponse object to modify
 * @returns The modified NextResponse with the cookie set
 */
export function setUserSession(userId: string, res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
  });

  return res;
}

/**
 * Clears the user session cookie (logs out the user).
 * To be used in route handlers (e.g., logout route).
 * 
 * @param res - The NextResponse object to modify
 * @returns The modified NextResponse with the cookie cleared
 */
export function clearUserSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return res;
}

