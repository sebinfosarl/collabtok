import { createClient } from '@supabase/supabase-js';

/**
 * Validates and returns the Supabase URL from environment variables.
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL is missing
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
}

/**
 * Validates and returns the Supabase anon key from environment variables.
 * @throws Error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
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
 */
export function createSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  return createClient(supabaseUrl, supabaseAnonKey);
}