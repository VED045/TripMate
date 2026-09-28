import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const tripId = new URL(request.url).searchParams.get('trip_id');
  if (!tripId) return NextResponse.json({ error: 'trip_id required' }, { status: 400 });

  const supabase = createServiceClient();
  const [itinerary, packing] = await Promise.all([
    supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('starts_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('packing_items')
      .select('*, assigned_member:members!packing_items_assigned_member_id_fkey(id,name,color)')
      .eq('trip_id', tripId)
      .order('is_complete')
      .order('created_at'),
  ]);

  if (itinerary.error || packing.error) {
    console.error('[GET /api/planning] error:', itinerary.error, packing.error);
    return NextResponse.json(
      { error: 'Could not fetch planning items' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    itinerary: itinerary.data || [],
    packing: packing.data || [],
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request JSON' }, { status: 400 });
  }

  const tripId = typeof body.trip_id === 'string' ? body.trip_id : '';
  const kind = body.kind === 'itinerary' || body.kind === 'packing' ? body.kind : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!tripId || !kind || !title || title.length > 160) {
    return NextResponse.json(
      { error: 'A title up to 160 characters and valid kind are required' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const createdBy = typeof body.member_id === 'string' ? body.member_id : null;

  if (kind === 'itinerary') {
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({
        trip_id: tripId,
        title,
        details: typeof body.details === 'string' ? body.details.slice(0, 1000) : null,
        location_name: typeof body.location_name === 'string' ? body.location_name.slice(0, 200) : null,
        starts_at: typeof body.starts_at === 'string' && body.starts_at ? body.starts_at : null,
        ends_at: typeof body.ends_at === 'string' && body.ends_at ? body.ends_at : null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/planning itinerary] error:', error);
      return NextResponse.json({ error: 'Could not save itinerary item' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } else {
    const assignedMemberId =
      typeof body.assigned_member_id === 'string' && body.assigned_member_id
        ? body.assigned_member_id
        : null;

    const { data, error } = await supabase
      .from('packing_items')
      .insert({
        trip_id: tripId,
        title,
        assigned_member_id: assignedMemberId,
        is_complete: false,
        created_by: createdBy,
      })
      .select('*, assigned_member:members!packing_items_assigned_member_id_fkey(id,name,color)')
      .single();

    if (error) {
      console.error('[POST /api/planning packing] error:', error);
      return NextResponse.json({ error: 'Could not save packing item' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request JSON' }, { status: 400 });
  }

  const tripId = typeof body.trip_id === 'string' ? body.trip_id : '';
  const id = typeof body.id === 'string' ? body.id : '';
  const kind =
    body.kind === 'itinerary' || body.kind === 'packing'
      ? body.kind
      : body.is_complete !== undefined
      ? 'packing'
      : 'itinerary';

  if (!tripId || !id) {
    return NextResponse.json({ error: 'trip_id and id required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (kind === 'packing') {
    const updateData: Record<string, unknown> = {};
    if (typeof body.is_complete === 'boolean') {
      updateData.is_complete = body.is_complete;
    }
    if (body.assigned_member_id !== undefined) {
      updateData.assigned_member_id =
        typeof body.assigned_member_id === 'string' && body.assigned_member_id
          ? body.assigned_member_id
          : null;
    }
    if (typeof body.title === 'string' && body.title.trim()) {
      updateData.title = body.title.trim().slice(0, 160);
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('packing_items')
      .update(updateData)
      .eq('id', id)
      .eq('trip_id', tripId)
      .select('*, assigned_member:members!packing_items_assigned_member_id_fkey(id,name,color)')
      .single();

    if (error) {
      console.error('[PATCH /api/planning packing] error:', error);
      return NextResponse.json({ error: 'Could not update packing item' }, { status: 500 });
    }
    return NextResponse.json(data);
  } else {
    // kind === 'itinerary'
    const updateData: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) {
      updateData.title = body.title.trim().slice(0, 160);
    }
    if (body.details !== undefined) {
      updateData.details = typeof body.details === 'string' ? body.details.slice(0, 1000) : null;
    }
    if (body.location_name !== undefined) {
      updateData.location_name =
        typeof body.location_name === 'string' ? body.location_name.slice(0, 200) : null;
    }
    if (body.starts_at !== undefined) {
      updateData.starts_at =
        typeof body.starts_at === 'string' && body.starts_at ? body.starts_at : null;
    }
    if (body.ends_at !== undefined) {
      updateData.ends_at =
        typeof body.ends_at === 'string' && body.ends_at ? body.ends_at : null;
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('itinerary_items')
      .update(updateData)
      .eq('id', id)
      .eq('trip_id', tripId)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/planning itinerary] error:', error);
      return NextResponse.json({ error: 'Could not update itinerary item' }, { status: 500 });
    }
    return NextResponse.json(data);
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  let tripId = searchParams.get('trip_id') || '';
  let id = searchParams.get('id') || '';
  let kind = searchParams.get('kind') || '';

  try {
    const json = await request.json();
    if (json) {
      if (!tripId && typeof json.trip_id === 'string') tripId = json.trip_id;
      if (!id && typeof json.id === 'string') id = json.id;
      if (!kind && typeof json.kind === 'string') kind = json.kind;
    }
  } catch {
    // If no JSON body, query params are used
  }

  if (!tripId || !id) {
    return NextResponse.json({ error: 'trip_id and id required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const table = kind === 'packing' ? 'packing_items' : 'itinerary_items';

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('trip_id', tripId);

  if (error) {
    console.error(`[DELETE /api/planning ${table}] error:`, error);
    return NextResponse.json({ error: `Could not delete ${kind || 'planning'} item` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
