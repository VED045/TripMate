import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStorageProvider } from '@/lib/storage';

const MAX_IMAGE_MB = parseInt(process.env.MAX_IMAGE_SIZE_MB || '50');
const MAX_VIDEO_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '500');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Support both "files" and "file"
    const files = formData.getAll('files').length > 0
      ? formData.getAll('files')
      : formData.getAll('file');

    const tripId = formData.get('trip_id') as string;
    const uploaderId = formData.get('uploader_id') as string | null;

    const tagMemberIds = JSON.parse(
      (formData.get('tag_member_ids') as string) || '[]'
    ) as string[];

    const albumIds = JSON.parse(
      (formData.get('album_ids') as string) || '[]'
    ) as string[];

    if (!tripId || files.length === 0) {
      return NextResponse.json(
        { error: 'file and trip_id required' },
        { status: 400 }
      );
    }

    const validFiles = files.filter(
      (item): item is File => item instanceof File
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid files received' },
        { status: 400 }
      );
    }

    const provider = getStorageProvider();

    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          error: `Storage provider "${provider.name}" is not configured. Check your environment variables.`,
        },
        { status: 503 }
      );
    }

    const supabase = createServiceClient();

    const uploadedRecords = [];

    for (const file of validFiles) {
      // Validate type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        return NextResponse.json(
          {
            error: `${file.name}: Only images and videos are allowed`,
          },
          { status: 400 }
        );
      }

      // Validate size
      const sizeMB = file.size / (1024 * 1024);
      const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;

      if (sizeMB > limit) {
        return NextResponse.json(
          {
            error: `${file.name}: File too large. Max ${limit}MB for ${isVideo ? 'videos' : 'images'
              }`,
          },
          { status: 413 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to storage
      const uploadResult = await provider.upload(buffer, {
        tripId,
        folder: `tripmate/${tripId}/${isVideo ? 'videos' : 'photos'}`,
        filename: file.name,
        mediaType: isVideo ? 'video' : 'photo',
        generateThumbnail: true,
      });

      // Save media record
      const { data: mediaRecord, error: dbError } = await supabase
        .from('media')
        .insert({
          trip_id: tripId,
          uploader_id: uploaderId || null,
          storage_provider: provider.name as 'cloudinary' | 'supabase',
          storage_path: uploadResult.path,
          external_file_id: uploadResult.externalFileId || null,
          filename: uploadResult.path.split('/').pop() || file.name,
          original_filename: file.name,
          mime_type: file.type,
          media_type: isVideo ? 'video' : 'photo',
          size_bytes: uploadResult.sizeBytes || file.size,
          width: uploadResult.width || null,
          height: uploadResult.height || null,
          duration_seconds: uploadResult.durationSeconds || null,
          url: uploadResult.url,
          thumbnail_url: uploadResult.thumbnailUrl || null,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Tags
      if (tagMemberIds.length > 0) {
        const { error: tagError } = await supabase
          .from('media_tags')
          .insert(
            tagMemberIds.map((memberId) => ({
              media_id: mediaRecord.id,
              member_id: memberId,
              tagged_by: uploaderId || null,
            }))
          );

        if (tagError) {
          console.error('[MEDIA TAG ERROR]', tagError);
        }
      }

      // Albums
      if (albumIds.length > 0) {
        const { error: albumError } = await supabase
          .from('album_media')
          .insert(
            albumIds.map((albumId) => ({
              album_id: albumId,
              media_id: mediaRecord.id,
              added_by: uploaderId || null,
            }))
          );

        if (albumError) {
          console.error('[ALBUM MEDIA ERROR]', albumError);
        }
      }

      // Timeline event
      const { error: timelineError } = await supabase
        .from('timeline_events')
        .insert({
          trip_id: tripId,
          event_type: 'media_uploaded',
          title: isVideo ? 'Video uploaded' : 'Photo uploaded',
          icon: isVideo ? '🎬' : '📸',
          color: '#8b5cf6',
          media_id: mediaRecord.id,
        });

      if (timelineError) {
        console.error('[TIMELINE ERROR]', timelineError);
      }

      uploadedRecords.push(mediaRecord);
    }

    return NextResponse.json(
      {
        success: true,
        count: uploadedRecords.length,
        media: uploadedRecords,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/media/upload]', err);

    const message =
      err instanceof Error ? err.message : 'Upload failed';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}