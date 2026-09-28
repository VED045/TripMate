import { NextRequest, NextResponse } from 'next/server';
import { createSSRClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { member_id } = await req.json();

    if (!member_id || typeof member_id !== 'string') {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
    }

    const sessionClient = await createSSRClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in before linking a trip identity' }, { status: 401 });
    }
    const userId = user.id;

    const supabase = createServiceClient();

    // Check if id is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const { data: trip, error: tripError } = isUUID
      ? await supabase.from('trips').select('id, name, slug, created_by').eq('id', id).single()
      : await supabase.from('trips').select('id, name, slug, created_by').eq('slug', id).single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify the member belongs to this trip
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, trip_id')
      .eq('id', member_id)
      .eq('trip_id', trip.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found in this trip' }, { status: 404 });
    }

    const { data: linkedMember } = await supabase
      .from('members')
      .select('id, name, auth_user_id')
      .eq('trip_id', trip.id)
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (linkedMember && linkedMember.id !== member_id) {
      return NextResponse.json({ error: `Your account is already linked to ${linkedMember.name} in this trip. Switch identity from the member picker instead.` }, { status: 409 });
    }

    const { data: claimedBy } = await supabase
      .from('members')
      .select('auth_user_id')
      .eq('id', member_id)
      .maybeSingle();
    if (claimedBy?.auth_user_id && claimedBy.auth_user_id !== userId) {
      return NextResponse.json({ error: 'This member is already linked to another account.' }, { status: 409 });
    }

    const { error: linkError } = await supabase
      .from('members')
      .update({ auth_user_id: userId, updated_at: new Date().toISOString() })
      .eq('id', member_id);
    if (linkError) throw linkError;

    const { error: userTripError } = await supabase.from('user_trips').upsert({
      user_id: userId,
      trip_id: trip.id,
      member_id,
      role: trip.created_by === member_id ? 'owner' : 'member',
      claimed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,trip_id' });
    if (userTripError) throw userTripError;

    // 1. Record claim in trip_access table
    try {
      await supabase
        .from('trip_access')
        .delete()
        .eq('trip_id', trip.id)
        .eq('user_agent', `auth:${userId}`);

      await supabase.from('trip_access').insert({
        trip_id: trip.id,
        member_id,
        user_agent: `auth:${userId}`,
        accessed_at: new Date().toISOString(),
      });
    } catch (accessErr) {
      console.warn('trip_access update notice:', accessErr);
    }

    // 2. Persist in Supabase Auth user_metadata so it is permanently linked to the user account
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user) {
        const existingClaimed = (userData.user.user_metadata?.claimed_trips || []).filter(
          (claim: unknown) => {
            if (!claim || typeof claim !== 'object') return false;
            const typedClaim = claim as { trip_id?: string; slug?: string };
            return typedClaim.trip_id !== trip.id && typedClaim.slug !== trip.slug;
          }
        );
        existingClaimed.push({
          trip_id: trip.id,
          slug: trip.slug,
          name: trip.name,
          member_id,
          member_name: member.name,
          claimed_at: new Date().toISOString(),
        });

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userData.user.user_metadata,
            claimed_trips: existingClaimed,
          },
        });
      }
    } catch (metaErr) {
      console.warn('user_metadata update notice:', metaErr);
    }

    // 3. Set created_by if unset
    if (!trip.created_by) {
      try {
        await supabase
          .from('trips')
          .update({ created_by: member_id })
          .eq('id', trip.id);
      } catch (e) {
        // ignore if not updatable
      }
    }

    return NextResponse.json({
      success: true,
      member_id,
      trip: { id: trip.id, slug: trip.slug, name: trip.name },
    }, { status: 200 });
  } catch (err: unknown) {
    console.error('[POST /api/trips/[slug]/claim]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
