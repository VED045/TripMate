// =============================================================================
// Storage Factory — returns the active provider based on STORAGE_PROVIDER env
// =============================================================================
import { StorageProvider } from './StorageProvider';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
import { SupabaseStorageProvider } from './SupabaseStorageProvider';

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  const providerName = process.env.STORAGE_PROVIDER || 'cloudinary';

  switch (providerName) {
    case 'cloudinary':
      _provider = new CloudinaryStorageProvider();
      break;
    case 'supabase':
      _provider = new SupabaseStorageProvider();
      break;
    default:
      console.warn(`Unknown storage provider "${providerName}", falling back to Cloudinary`);
      _provider = new CloudinaryStorageProvider();
  }

  if (!_provider.isConfigured()) {
    console.warn(
      `⚠️  Storage provider "${providerName}" is not configured. ` +
      `Set the required environment variables. Media uploads will fail until configured.`
    );
  }

  return _provider;
}

export type { StorageProvider, UploadOptions, UploadResult } from './StorageProvider';
export { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
export { SupabaseStorageProvider } from './SupabaseStorageProvider';
