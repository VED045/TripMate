// =============================================================================
// Supabase Storage Provider
// Used for smaller files: receipts, avatars, cover images
// Also fallback when Cloudinary is not configured
// =============================================================================
import { StorageProvider, UploadOptions, UploadResult } from './StorageProvider';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET_NAME = 'tripmate-media';

export class SupabaseStorageProvider implements StorageProvider {
  name = 'supabase';

  isConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
  }

  async upload(file: Buffer | Blob, options: UploadOptions): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Supabase Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY.');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const ext = options.filename?.split('.').pop() || (options.mediaType === 'video' ? 'mp4' : 'jpg');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const path = `${options.tripId}/${options.mediaType}s/${uniqueName}`;

    const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: options.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: false,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path,
      thumbnailUrl: urlData.publicUrl, // Supabase doesn't auto-generate thumbnails
      sizeBytes: buffer.length,
    };
  }

  async delete(path: string): Promise<void> {
    if (!this.isConfigured()) throw new Error('Supabase not configured.');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }

  async getDownloadUrl(path: string): Promise<string> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresInSeconds);
    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
  }

  getThumbnailUrl(path: string, _width?: number, _height?: number): string {
    // Supabase doesn't have built-in transformations on free tier
    // Return public URL directly
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }
}
