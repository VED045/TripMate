// =============================================================================
// Cloudinary Storage Provider
// Primary media storage for photos/videos (25GB free tier)
// Originals preserved — thumbnails generated via URL transformations
// =============================================================================
import { StorageProvider, UploadOptions, UploadResult } from './StorageProvider';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export class CloudinaryStorageProvider implements StorageProvider {
  name = 'cloudinary';

  isConfigured(): boolean {
    return !!(CLOUD_NAME && API_KEY && API_SECRET);
  }

  async upload(file: Buffer | Blob, options: UploadOptions): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary not configured. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
    }

    const folder = options.folder || `tripmate/${options.tripId}`;
    const timestamp = Math.round(Date.now() / 1000);
    const resourceType = options.mediaType === 'video' ? 'video' : 'image';

    // Build params for signature
    const params: Record<string, string | number> = {
      folder,
      timestamp,
      // Keep original quality — no transformation on upload
      ...(options.publicId ? { public_id: options.publicId } : {}),
    };

    // Generate signature server-side
    const signature = await this.generateSignature(params);

    const formData = new FormData();
    
    if (file instanceof Blob) {
      formData.append('file', file);
    } else {
      const u8 = new Uint8Array(file);
      formData.append('file', new Blob([u8]));
    }
    
    formData.append('api_key', API_KEY);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
    
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudinary upload failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      path: data.public_id,
      thumbnailUrl: this.getThumbnailUrl(data.public_id, 400, 400),
      width: data.width,
      height: data.height,
      durationSeconds: data.duration,
      sizeBytes: data.bytes,
    };
  }

  async delete(path: string): Promise<void> {
    if (!this.isConfigured()) throw new Error('Cloudinary not configured.');
    
    const timestamp = Math.round(Date.now() / 1000);
    const signature = await this.generateSignature({ public_id: path, timestamp });

    const formData = new FormData();
    formData.append('public_id', path);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary delete failed: ${response.statusText}`);
    }
  }

  async getDownloadUrl(path: string): Promise<string> {
    // Cloudinary public URLs are permanent for public assets
    // For private assets, use signed URL
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_attachment/${path}`;
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    if (!this.isConfigured()) throw new Error('Cloudinary not configured.');
    
    const timestamp = Math.round(Date.now() / 1000);
    const expireAt = timestamp + expiresInSeconds;
    const params = { public_id: path, timestamp: expireAt };
    const signature = await this.generateSignature(params);
    
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/s--${signature}--/${path}`;
  }

  /** Get optimized thumbnail URL using Cloudinary transformations */
  getThumbnailUrl(path: string, width = 400, height = 400): string {
    if (!CLOUD_NAME) return '';
    // c_fill = crop to fill, q_auto = auto quality, f_auto = auto format
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${path}`;
  }

  /** Get original file URL (no transformations) */
  getOriginalUrl(path: string): string {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${path}`;
  }

  private async generateSignature(params: Record<string, string | number>): Promise<string> {
    // Sort params alphabetically and create signature string
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const signatureString = sortedParams + API_SECRET;
    
    // Use Web Crypto API for SHA-1 (Node.js compatible)
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
