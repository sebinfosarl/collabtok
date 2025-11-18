import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}

/**
 * Creates a Supabase client instance.
 * Can be used in both server components and API routes.
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Export a default client instance for convenience
export const supabase = createSupabaseClient();

