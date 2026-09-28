import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id, member_id } = await req.json();

    if (!user_id || !member_id) {
      return NextResponse.json({ error: 'user_id and member_id are required' }, { status: 400 });
    }

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

    // 1. Record claim in trip_access table
    try {
      await supabase
        .from('trip_access')
        .delete()
        .eq('trip_id', trip.id)
        .eq('user_agent', `auth:${user_id}`);

      await supabase.from('trip_access').insert({
        trip_id: trip.id,
        member_id,
        user_agent: `auth:${user_id}`,
        accessed_at: new Date().toISOString(),
      });
    } catch (accessErr) {
      console.warn('trip_access update notice:', accessErr);
    }

    // 2. Persist in Supabase Auth user_metadata so it is permanently linked to the user account
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(user_id);
      if (userData?.user) {
        const existingClaimed = (userData.user.user_metadata?.claimed_trips || []).filter(
          (t: any) => t.trip_id !== trip.id && t.slug !== trip.slug
        );
        existingClaimed.push({
          trip_id: trip.id,
          slug: trip.slug,
          name: trip.name,
          member_id,
          member_name: member.name,
          claimed_at: new Date().toISOString(),
        });

        await supabase.auth.admin.updateUserById(user_id, {
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
