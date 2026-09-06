
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStorageProvider } from '@/lib/storage';

const MAX_IMAGE_MB = parseInt(
  process.env.MAX_IMAGE_SIZE_MB || '50',
  10
);

const MAX_VIDEO_MB = parseInt(
  process.env.MAX_VIDEO_SIZE_MB || '500',
  10
);

/**
 * Safely parse a JSON array from FormData.
 * Prevents malformed tag_member_ids / album_ids from causing
 * an unnecessary 500 response.
 */
function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value || typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string => typeof item === 'string'
    );
  } catch {
    return [];
  }
}

/**
 * Basic UUID validation.
 *
 * This prevents values such as "travel" from reaching a UUID
 * database column and turning into PostgreSQL error 22P02.
 */
function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Support both "files" and "file".
    const filesField = formData.getAll('files');

    const files =
      filesField.length > 0
        ? filesField
        : formData.getAll('file');

    const tripId = formData.get('trip_id') as string | null;
    const uploaderId =
      (formData.get('uploader_id') as string | null) || null;

    const tagMemberIds = parseJsonArray(
      formData.get('tag_member_ids')
    );

    const albumIds = parseJsonArray(
      formData.get('album_ids')
    );

    // ---------------------------------------------------------
    // Validate trip ID
    // ---------------------------------------------------------

    if (!tripId) {
      return NextResponse.json(
        {
          error: 'trip_id is required',
        },
        { status: 400 }
      );
    }

    if (!isValidUuid(tripId)) {
      return NextResponse.json(
        {
          error: 'trip_id must be a valid UUID',
          received: tripId,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate uploader ID if supplied
    // ---------------------------------------------------------

    if (uploaderId && !isValidUuid(uploaderId)) {
      return NextResponse.json(
        {
          error: 'uploader_id must be a valid UUID',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate files
    // ---------------------------------------------------------

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: 'At least one file is required',
        },
        { status: 400 }
      );
    }

    const validFiles = files.filter(
      (item): item is File => item instanceof File
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid files received',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Storage provider
    // ---------------------------------------------------------

    const provider = getStorageProvider();

    if (!provider.isConfigured()) {
      console.error(
        '[MEDIA STORAGE] Provider is not configured:',
        provider.name
      );

      return NextResponse.json(
        {
          error: `Storage provider "${provider.name}" is not configured. Check your environment variables.`,
        },
        { status: 503 }
      );
    }

    console.log('[MEDIA UPLOAD]', {
      provider: provider.name,
      tripId,
      fileCount: validFiles.length,
      hasUploaderId: Boolean(uploaderId),
    });

    const supabase = createServiceClient();

    const uploadedRecords = [];

    // ---------------------------------------------------------
    // Upload each file
    // ---------------------------------------------------------

    for (const file of validFiles) {
      // -------------------------------------------------------
      // Validate MIME type
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // Validate file size
      // -------------------------------------------------------

      const sizeMB = file.size / (1024 * 1024);

      const limit = isVideo
        ? MAX_VIDEO_MB
        : MAX_IMAGE_MB;

      if (sizeMB > limit) {
        return NextResponse.json(
          {
            error: `${file.name}: File too large. Maximum ${limit}MB allowed for ${isVideo ? 'videos' : 'images'
              }.`,
          },
          { status: 413 }
        );
      }

      console.log('[MEDIA FILE]', {
        name: file.name,
        type: file.type,
        sizeMB: Number(sizeMB.toFixed(2)),
        mediaType: isVideo ? 'video' : 'photo',
      });

      // -------------------------------------------------------
      // Convert File → Buffer
      // -------------------------------------------------------

      const buffer = Buffer.from(
        await file.arrayBuffer()
      );

      // -------------------------------------------------------
      // Storage folder
      // -------------------------------------------------------

      const folder = `tripmate/${tripId}/${isVideo ? 'videos' : 'photos'
        }`;

      console.log('[MEDIA STORAGE UPLOAD]', {
        provider: provider.name,
        folder,
        mediaType: isVideo ? 'video' : 'photo',
      });

      // -------------------------------------------------------
      // Upload to storage provider
      // -------------------------------------------------------

      const uploadResult = await provider.upload(buffer, {
        tripId,
        folder,
        filename: file.name,
        mediaType: isVideo ? 'video' : 'photo',
        generateThumbnail: true,
      });

      if (!uploadResult?.url) {
        throw new Error(
          `Storage upload completed without returning a URL for "${file.name}"`
        );
      }

      // -------------------------------------------------------
      // Save media record
      // -------------------------------------------------------

      const { data: mediaRecord, error: dbError } =
        await supabase
          .from('media')
          .insert({
            trip_id: tripId,
            uploader_id: uploaderId,

            storage_provider:
              provider.name as 'cloudinary' | 'supabase',

            storage_path: uploadResult.path,

            external_file_id:
              uploadResult.externalFileId || null,

            filename:
              uploadResult.path.split('/').pop() ||
              file.name,

            original_filename: file.name,
            mime_type: file.type,

            media_type: isVideo
              ? 'video'
              : 'photo',

            size_bytes:
              uploadResult.sizeBytes ||
              file.size,

            width:
              uploadResult.width ||
              null,

            height:
              uploadResult.height ||
              null,

            duration_seconds:
              uploadResult.durationSeconds ||
              null,

            url: uploadResult.url,

            thumbnail_url:
              uploadResult.thumbnailUrl ||
              null,
          })
          .select()
          .single();

      if (dbError) {
        console.error(
          '[MEDIA DATABASE ERROR]',
          dbError
        );

        throw new Error(
          `Media uploaded successfully but database record creation failed: ${dbError.message}`
        );
      }

      // -------------------------------------------------------
      // Tags
      // -------------------------------------------------------

      if (tagMemberIds.length > 0) {
        const { error: tagError } =
          await supabase
            .from('media_tags')
            .insert(
              tagMemberIds.map((memberId) => ({
                media_id: mediaRecord.id,
                member_id: memberId,
                tagged_by: uploaderId,
              }))
            );

        if (tagError) {
          console.error(
            '[MEDIA TAG ERROR]',
            tagError
          );
        }
      }

      // -------------------------------------------------------
      // Albums
      // -------------------------------------------------------

      if (albumIds.length > 0) {
        const { error: albumError } =
          await supabase
            .from('album_media')
            .insert(
              albumIds.map((albumId) => ({
                album_id: albumId,
                media_id: mediaRecord.id,
                added_by: uploaderId,
              }))
            );

        if (albumError) {
          console.error(
            '[ALBUM MEDIA ERROR]',
            albumError
          );
        }
      }

      // -------------------------------------------------------
      // Timeline event
      // -------------------------------------------------------

      const { error: timelineError } =
        await supabase
          .from('timeline_events')
          .insert({
            trip_id: tripId,
            event_type: 'media_uploaded',
            title: isVideo
              ? 'Video uploaded'
              : 'Photo uploaded',
            icon: isVideo
              ? '🎬'
              : '📸',
            color: '#8b5cf6',
            media_id: mediaRecord.id,
          });

      if (timelineError) {
        console.error(
          '[TIMELINE ERROR]',
          timelineError
        );
      }

      uploadedRecords.push(mediaRecord);
    }

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        count: uploadedRecords.length,
        media: uploadedRecords,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error(
      '[POST /api/media/upload]',
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : 'Upload failed';

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

