import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createSSRClient } from '@/lib/supabase/server';

const PROFILE_FIELDS = ['display_name', 'phone', 'default_upi_id', 'upi_display_name', 'bio'] as const;
type ProfileField = typeof PROFILE_FIELDS[number];
type Profile = Record<ProfileField, string>;

const emptyProfile = (): Profile => ({ display_name: '', phone: '', default_upi_id: '', upi_display_name: '', bio: '' });

function isMissingProfilesTable(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || /profiles.*(does not exist|schema cache)/i.test(error?.message || '');
}

function getProfile(value: unknown, fallbackName = ''): Profile {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const profile = emptyProfile();
  for (const field of PROFILE_FIELDS) profile[field] = typeof source[field] === 'string' ? source[field] : '';
  profile.display_name ||= fallbackName;
  return profile;
}

async function currentUser() {
  const client = await createSSRClient();
  const { data: { user }, error } = await client.auth.getUser();
  return { user, error };
}

export async function GET() {
  const { user, error } = await currentUser();
  if (error || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const service = createServiceClient();
  const { data, error: profileError } = await service.from('profiles').select('display_name, phone, default_upi_id, upi_display_name, bio').eq('id', user.id).maybeSingle();
  if (profileError && !isMissingProfilesTable(profileError)) return NextResponse.json({ error: 'Could not load profile' }, { status: 500 });

  // A missing migration should not make the account screen unusable. Retain a
  // sanitized copy in auth metadata until the profiles table is deployed.
  const metadata = user.user_metadata?.tripmate_profile;
  return NextResponse.json({
    profile: getProfile(data || metadata, user.user_metadata?.full_name || user.user_metadata?.name || ''),
    storage: data ? 'table' : 'metadata',
  });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await currentUser();
  if (error || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });

  const profile = getProfile(body);
  const limits: Record<ProfileField, number> = { display_name: 120, phone: 32, default_upi_id: 120, upi_display_name: 120, bio: 280 };
  for (const field of PROFILE_FIELDS) {
    profile[field] = profile[field].trim();
    if (profile[field].length > limits[field]) return NextResponse.json({ error: `${field.replaceAll('_', ' ')} is too long` }, { status: 400 });
  }

  const service = createServiceClient();
  const { error: saveError } = await service.from('profiles').upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
  if (saveError && !isMissingProfilesTable(saveError)) return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });

  const { error: metadataError } = await service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, full_name: profile.display_name || user.user_metadata?.full_name, tripmate_profile: profile },
  });
  if (metadataError) return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  return NextResponse.json({ profile, storage: saveError ? 'metadata' : 'table' });
}
