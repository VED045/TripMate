import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('trip_id', tripId)
      .neq('event_type', 'media_uploaded')
      .order('event_time', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[GET /api/timeline]', err);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trip_id, title, description, icon, color, event_time } = body;

    if (!trip_id || !title?.trim()) {
      return NextResponse.json({ error: 'trip_id and title are required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('timeline_events')
      .insert({
        trip_id,
        event_type: 'manual',
        title: title.trim(),
        description: description?.trim() || null,
        icon: icon || '📌',
        color: color || '#f59e0b',
        event_time: event_time || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/timeline]', err);
    return NextResponse.json({ error: 'Failed to add timeline event' }, { status: 500 });
  }
}
