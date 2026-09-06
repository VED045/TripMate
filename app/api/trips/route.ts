import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

function generateColor(): string {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#eab308','#ef4444','#84cc16','#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trip, members } = body;

    if (!trip?.name?.trim()) {
      return NextResponse.json({ error: 'Trip name required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const slug = generateSlug(trip.name);

    // Create trip
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: trip.name.trim(),
        slug,
        description: trip.description || null,
        start_date: trip.start_date || null,
        end_date: trip.end_date || null,
        currency: 'INR',
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Create members
    const memberInserts = (members || [])
      .filter((m: { name: string }) => m.name?.trim())
      .map((m: { name: string; upi_id?: string }, i: number) => ({
        trip_id: tripData.id,
        name: m.name.trim(),
        upi_id: m.upi_id?.trim() || null,
        is_admin: i === 0, // First member is admin
        color: generateColor(),
      }));

    if (memberInserts.length > 0) {
      const { error: memberError } = await supabase.from('members').insert(memberInserts);
      if (memberError) throw memberError;
    }

    // Create default albums
    const defaultAlbums = ['Everyone', 'Beach', 'Food', 'Travel', 'Stay', 'Activities'];
    const albumInserts = defaultAlbums.map(name => ({
      trip_id: tripData.id,
      name,
      is_default: true,
    }));
    await supabase.from('albums').insert(albumInserts);

    // Create a trip started timeline event
    await supabase.from('timeline_events').insert({
      trip_id: tripData.id,
      event_type: 'trip_started',
      title: `${trip.name} begins!`,
      description: `Trip created with ${memberInserts.length} people`,
      icon: '🚀',
      color: '#6366f1',
    });

    return NextResponse.json({ id: tripData.id, slug: tripData.slug }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/trips]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const supabase = createServiceClient();

    if (slug) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      return NextResponse.json(data);
    }

    const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[GET /api/trips]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
