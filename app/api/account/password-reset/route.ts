import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createSSRClient } from '@/lib/supabase/server';

export async function POST() {
  const client = await createSSRClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user?.email) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') || new URL(requestHeaders.get('referer') || 'http://localhost').origin;
  const { error } = await client.auth.resetPasswordForEmail(user.email, { redirectTo: `${origin}/reset-password` });
  if (error) return NextResponse.json({ error: 'Could not send reset email' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
