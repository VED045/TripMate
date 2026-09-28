// =============================================================================
// Supabase Client — Server (for use in Server Components, API Routes)
// =============================================================================
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpamkktglxmbvraowvh.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tk2ghB6HgFt9UWEKfXA9gg_5xLdniQT';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

/** Service-role client — bypasses RLS. Only use in trusted server contexts. */
export function createServiceClient() {
  return createSupabaseClient<any>(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/** Server client with anon key — respects RLS */
export function createAnonClient() {
  return createSupabaseClient<any>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * SSR-aware server client that reads/writes auth cookies.
 * Use in Server Components and API routes that need session context.
 */
export async function createSSRClient() {
  const cookieStore = await cookies();
  return createServerClient<any>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies can't be set; middleware handles refresh
          }
        },
      },
    }
  );
}
