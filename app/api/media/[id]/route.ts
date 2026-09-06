import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStorageProvider } from '@/lib/storage';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServiceClient();

    const updateData: Record<string, unknown> = {};
    if (body.is_favorite !== undefined) updateData.is_favorite = Boolean(body.is_favorite);
    if (body.filename !== undefined) updateData.filename = body.filename;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('media')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[PATCH /api/media/[id]]', err);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Get media record
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Try deleting from storage provider
    try {
      const provider = getStorageProvider();
      await provider.delete(media.storage_path);
    } catch (storageErr) {
      console.warn('Storage deletion warning:', storageErr);
    }

    // Delete from database (cascades tags and album_media)
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/media/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
