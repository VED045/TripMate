import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Check if id is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const query = supabase.from('trips').select('*');
    const { data: trip, error: tripError } = isUUID
      ? await query.eq('id', id).single()
      : await query.eq('slug', id).single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get members
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: true });

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .or(`trip_id.eq.${trip.id},trip_id.is.null`)
      .order('name', { ascending: true });

    // Get albums
    const { data: albums } = await supabase
      .from('albums')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      trip,
      members: members || [],
      categories: categories || [],
      albums: albums || []
    });
  } catch (err: unknown) {
    console.error('[GET /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServiceClient();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url;
    if (body.access_code !== undefined) updateData.access_code = body.access_code;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[PATCH /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
