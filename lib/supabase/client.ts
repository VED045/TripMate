// =============================================================================
// Supabase Client — Browser (for use in Client Components)
// =============================================================================
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvpamkktglxmbvraowvh.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tk2ghB6HgFt9UWEKfXA9gg_5xLdniQT'
  );
}
