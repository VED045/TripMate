import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStorageProvider } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get('id');
    const albumId = searchParams.get('album_id');
    const tripId = searchParams.get('trip_id');

    const supabase = createServiceClient();
    const provider = getStorageProvider();

    // Single file download
    if (mediaId) {
      const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();
      if (error || !media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

      const downloadUrl = await provider.getDownloadUrl(media.storage_path);
      return NextResponse.json({ url: downloadUrl, filename: media.original_filename });
    }

    // Album download — return list of download URLs
    if (albumId) {
      const { data: albumMedia, error } = await supabase
        .from('album_media')
        .select('media:media(id, storage_path, original_filename, media_type)')
        .eq('album_id', albumId);
      if (error) throw error;

      const files = await Promise.all(
        (albumMedia || []).map(async (am: any) => {
          const m = Array.isArray(am.media) ? am.media[0] : am.media;
          if (!m) return null;
          const url = await provider.getDownloadUrl(m.storage_path);
          return { url, filename: m.original_filename, type: m.media_type };
        })
      );
      return NextResponse.json({ files: files.filter(Boolean) });
    }

    // All trip media — return signed URLs
    if (tripId) {
      const { data: media, error } = await supabase
        .from('media')
        .select('id, storage_path, original_filename, media_type')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const files = await Promise.all(
        (media || []).map(async m => {
          const url = await provider.getDownloadUrl(m.storage_path);
          return { id: m.id, url, filename: m.original_filename, type: m.media_type };
        })
      );
      return NextResponse.json({ files });
    }

    return NextResponse.json({ error: 'id, album_id, or trip_id required' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[GET /api/media/download]', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
