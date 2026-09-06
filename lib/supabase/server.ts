// =============================================================================
// Supabase Client — Server (for use in Server Components, API Routes)
// =============================================================================
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && !serviceKey.includes('your_service_role_key') && serviceKey.trim().length > 10) {
    return serviceKey.trim();
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey && !anonKey.includes('your_') && anonKey.trim().length > 10) {
    return anonKey.trim();
  }
  return 'sb_publishable_tk2ghB6HgFt9UWEKfXA9gg_5xLdniQT';
}

/** Server client with service role key (or fallback to anon key) */
export function createServiceClient() {
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpamkktglxmbvraowvh.supabase.co',
    getServiceKey(),
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
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpamkktglxmbvraowvh.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tk2ghB6HgFt9UWEKfXA9gg_5xLdniQT'
  );
}
