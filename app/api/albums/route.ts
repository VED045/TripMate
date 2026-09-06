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
    
    // Get albums with media count
    const { data: albums, error } = await supabase
      .from('albums')
      .select(`
        *,
        album_media (
          media:media_id (
            id,
            url,
            thumbnail_url,
            media_type
          )
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const enriched = (albums || []).map((album: any) => ({
      ...album,
      media_count: album.album_media?.length || 0,
      preview_thumbnails: album.album_media?.slice(0, 4).map((am: any) => am.media?.thumbnail_url || am.media?.url).filter(Boolean) || [],
    }));

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    console.error('[GET /api/albums]', err);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trip_id, name, description } = body;

    if (!trip_id || !name?.trim()) {
      return NextResponse.json({ error: 'trip_id and name are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('albums')
      .insert({
        trip_id,
        name: name.trim(),
        description: description?.trim() || null,
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Timeline event
    await supabase.from('timeline_events').insert({
      trip_id,
      event_type: 'album_created',
      title: `Created album "${name.trim()}"`,
      description: description?.trim() || null,
      icon: '📁',
      album_id: data.id,
      color: '#06b6d4',
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/albums]', err);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Album id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from('albums').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/albums]', err);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
