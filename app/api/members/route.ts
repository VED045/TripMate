import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', 
  '#10b981', '#06b6d4', '#eab308', '#ef4444', 
  '#84cc16', '#f43f5e', '#14b8a6', '#a855f7'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[GET /api/members]', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trip_id, name, upi_id, color, is_admin } = body;

    if (!trip_id || !name?.trim()) {
      return NextResponse.json({ error: 'trip_id and name are required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const assignedColor = color || MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];

    const { data, error } = await supabase
      .from('members')
      .insert({
        trip_id,
        name: name.trim(),
        upi_id: upi_id?.trim() || null,
        color: assignedColor,
        is_admin: Boolean(is_admin),
      })
      .select()
      .single();

    if (error) throw error;

    // Timeline event
    await supabase.from('timeline_events').insert({
      trip_id,
      event_type: 'member_added',
      title: `${name.trim()} joined the trip!`,
      description: 'New crew member added',
      icon: '👋',
      member_id: data.id,
      color: assignedColor,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/members]', err);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, upi_id, color, avatar_url, is_admin } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (upi_id !== undefined) updateData.upi_id = upi_id?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (is_admin !== undefined) updateData.is_admin = is_admin;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[PATCH /api/members]', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/members]', err);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
