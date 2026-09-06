// =============================================================================
// Storage Provider Interface
// All media storage providers must implement this interface.
// Switch providers by changing STORAGE_PROVIDER env var.
// =============================================================================

export interface UploadResult {
  url: string;
  path: string; // storage path / public_id
  externalFileId?: string; // Google Drive file ID etc.
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  sizeBytes?: number;
}

export interface StorageProvider {
  name: string;
  
  /** Upload a file, return metadata */
  upload(
    file: Buffer | Blob,
    options: UploadOptions
  ): Promise<UploadResult>;
  
  /** Delete a file by path */
  delete(path: string): Promise<void>;
  
  /** Get a permanent or long-lived download URL */
  getDownloadUrl(path: string): Promise<string>;
  
  /** Get a short-lived signed URL */
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
  
  /** Get optimized thumbnail URL */
  getThumbnailUrl(path: string, width?: number, height?: number): string;
  
  /** Whether the provider is configured and ready */
  isConfigured(): boolean;
}

export interface UploadOptions {
  folder?: string;
  filename?: string;
  mediaType: 'photo' | 'video';
  tripId: string;
  generateThumbnail?: boolean;
  publicId?: string;
}
