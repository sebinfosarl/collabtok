import { createClient } from '@supabase/supabase-js';

/**
 * Checks if we're in a Next.js build context.
 * During build, environment variables might not be available.
 */
function isBuildTime(): boolean {
  // Check for Next.js build phase indicator (most reliable)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }
  // Fallback: if we're in a server context during production build
  // and don't have a request context, we're likely in build phase
  // Note: This is a heuristic and may not be 100% accurate
  return typeof window === 'undefined' && 
         process.env.NODE_ENV === 'production' &&
         !process.env.VERCEL_ENV; // VERCEL_ENV is only set at runtime, not during build
}

/**
 * Validates and returns the Supabase URL from environment variables.
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL is missing (only at runtime, not during build)
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    // During build, return a placeholder to avoid breaking the build
    // The actual validation will happen at runtime when the route is called
    if (isBuildTime()) {
      return 'https://placeholder.supabase.co';
    }
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
}

/**
 * Validates and returns the Supabase anon key from environment variables.
 * @throws Error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing (only at runtime, not during build)
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    // During build, return a placeholder to avoid breaking the build
    // The actual validation will happen at runtime when the route is called
    if (isBuildTime()) {
      return 'placeholder-key';
    }
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key;
}

/**
 * Creates a Supabase client instance with validated environment variables.
 * Can be used in both server components and API routes.
 * 
 * Note: This function should be called at runtime, not at module load time,
 * to ensure environment variables are available.
 * 
 * During build time, this will create a client with placeholder values to avoid build errors.
 * The actual validation happens at runtime when the route handler executes.
 */
export function createSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  return createClient(supabaseUrl, supabaseAnonKey);
}