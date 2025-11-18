import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseClient';

/**
 * Test route to verify Supabase connection
 * 
 * Visit: http://localhost:3000/api/supabase-test
 * 
 * Expected response if working:
 * { "ok": true, "userCount": 0 }
 * 
 * Expected response if error:
 * { "ok": false, "error": "error message" }
 */
export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // Test query: count users
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { 
          ok: false, 
          error: error.message,
          details: 'Make sure you have run the SQL schema in Supabase SQL Editor'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      ok: true,
      userCount: count ?? 0,
      message: 'Supabase connection successful! 🎉'
    });
  } catch (error) {
    console.error('Supabase connection error:', error);
    
    // Check if it's an environment variable error
    if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
      return NextResponse.json(
        { 
          ok: false, 
          error: error.message,
          details: 'Please check your .env.local file and make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly. Don\'t forget to restart your dev server after editing .env.local!'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

