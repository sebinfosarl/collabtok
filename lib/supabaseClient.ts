import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL env var');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY env var');
}

// After runtime checks, these are guaranteed to be strings
const SUPABASE_URL: string = supabaseUrl as string;
const SUPABASE_ANON_KEY: string = supabaseAnonKey as string;

/**
 * Creates a Supabase client instance.
 * Can be used in both server components and API routes.
 */
export function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Export a default client instance for convenience
export const supabase = createSupabaseClient();

