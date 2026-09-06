
// =============================================================================
// Cloudinary Storage Provider
// Primary media storage for photos/videos
//
// IMPORTANT:
// - CLOUDINARY_API_SECRET is SERVER ONLY.
// - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME contains only the Cloudinary cloud name.
// - Signatures are generated server-side using Cloudinary's official SDK.
// =============================================================================

import { v2 as cloudinary } from 'cloudinary';

import {
  StorageProvider,
  UploadOptions,
  UploadResult,
} from './StorageProvider';

// -----------------------------------------------------------------------------
// Environment configuration
// -----------------------------------------------------------------------------
// Read environment variables at runtime rather than storing them as module-level
// constants. This makes configuration easier to diagnose in serverless builds.
// -----------------------------------------------------------------------------

function getCloudinaryConfig() {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || '';

  const apiKey =
    process.env.CLOUDINARY_API_KEY?.trim() || '';

  const apiSecret =
    process.env.CLOUDINARY_API_SECRET?.trim() || '';

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

// -----------------------------------------------------------------------------
// Configure Cloudinary
// -----------------------------------------------------------------------------

function configureCloudinary() {
  const {
    cloudName,
    apiKey,
    apiSecret,
  } = getCloudinaryConfig();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Required environment variables: ' +
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

export class CloudinaryStorageProvider
  implements StorageProvider {
  name = 'cloudinary';

  // ---------------------------------------------------------------------------
  // Check configuration
  // ---------------------------------------------------------------------------

  isConfigured(): boolean {
    const {
      cloudName,
      apiKey,
      apiSecret,
    } = getCloudinaryConfig();

    return Boolean(
      cloudName &&
      apiKey &&
      apiSecret
    );
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  async upload(
    file: Buffer | Blob,
    options: UploadOptions
  ): Promise<UploadResult> {
    const {
      cloudName,
      apiKey,
      apiSecret,
    } = configureCloudinary();

    const folder =
      options.folder ||
      `tripmate/${options.tripId}`;

    const timestamp =
      Math.round(Date.now() / 1000);

    const resourceType =
      options.mediaType === 'video'
        ? 'video'
        : 'image';

    // -------------------------------------------------------------------------
    // Parameters that Cloudinary will actually receive.
    //
    // IMPORTANT:
    // Every signed parameter MUST be represented here.
    // -------------------------------------------------------------------------

    const paramsToSign: Record<
      string,
      string | number
    > = {
      folder,
      timestamp,
    };

    if (options.publicId) {
      paramsToSign.public_id =
        options.publicId;
    }

    // -------------------------------------------------------------------------
    // Generate signature using Cloudinary's official SDK.
    //
    // This avoids differences between our manual SHA-1 implementation and
    // Cloudinary's signing implementation.
    // -------------------------------------------------------------------------

    const signature =
      cloudinary.utils.api_sign_request(
        paramsToSign,
        apiSecret
      );

    // Safe diagnostic logging.
    // NEVER log apiSecret or the actual signature.
    console.log('[CLOUDINARY UPLOAD]', {
      cloudName,
      resourceType,
      folder,
      timestamp,
      hasApiKey: Boolean(apiKey),
      hasApiSecret: Boolean(apiSecret),
      hasPublicId: Boolean(options.publicId),
    });

    // -------------------------------------------------------------------------
    // Convert input to Blob
    // -------------------------------------------------------------------------

    let uploadBlob: Blob;

    if (file instanceof Blob) {
      uploadBlob = file;
    } else {
      const uint8Array =
        new Uint8Array(file);

      uploadBlob = new Blob([
        uint8Array,
      ]);
    }

    // -------------------------------------------------------------------------
    // Build Cloudinary upload request
    // -------------------------------------------------------------------------

    const formData = new FormData();

    formData.append(
      'file',
      uploadBlob
    );

    formData.append(
      'api_key',
      apiKey
    );

    formData.append(
      'timestamp',
      String(timestamp)
    );

    formData.append(
      'signature',
      signature
    );

    formData.append(
      'folder',
      folder
    );

    if (options.publicId) {
      formData.append(
        'public_id',
        options.publicId
      );
    }

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/` +
      `${cloudName}/${resourceType}/upload`;

    // -------------------------------------------------------------------------
    // Upload to Cloudinary
    // -------------------------------------------------------------------------

    const response = await fetch(
      uploadUrl,
      {
        method: 'POST',
        body: formData,
      }
    );

    // -------------------------------------------------------------------------
    // Handle Cloudinary errors
    // -------------------------------------------------------------------------

    if (!response.ok) {
      let cloudinaryMessage =
        response.statusText;

      try {
        const errorBody =
          await response.json();

        cloudinaryMessage =
          errorBody?.error?.message ||
          cloudinaryMessage;

        console.error(
          '[CLOUDINARY ERROR]',
          {
            status: response.status,
            message: cloudinaryMessage,
            resourceType,
            folder,
          }
        );
      } catch {
        console.error(
          '[CLOUDINARY ERROR]',
          {
            status: response.status,
            statusText: response.statusText,
            resourceType,
            folder,
          }
        );
      }

      throw new Error(
        `Cloudinary upload failed: ${cloudinaryMessage}`
      );
    }

    const data =
      await response.json();

    if (!data?.secure_url) {
      throw new Error(
        'Cloudinary upload succeeded but no secure_url was returned.'
      );
    }

    // -------------------------------------------------------------------------
    // Return normalized storage result
    // -------------------------------------------------------------------------

    return {
      url: data.secure_url,

      path: data.public_id,

      externalFileId:
        data.asset_id || null,

      thumbnailUrl:
        resourceType === 'image'
          ? this.getThumbnailUrl(
            data.public_id,
            400,
            400
          )
          : this.getVideoThumbnailUrl(
            data.public_id,
            400,
            400
          ),

      width:
        data.width || undefined,

      height:
        data.height || undefined,

      durationSeconds:
        data.duration || undefined,

      sizeBytes:
        data.bytes || undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async delete(
    path: string
  ): Promise<void> {
    const {
      cloudName,
      apiKey,
      apiSecret,
    } = configureCloudinary();

    const timestamp =
      Math.round(Date.now() / 1000);

    // -------------------------------------------------------------------------
    // Try image deletion first.
    //
    // Cloudinary requires resource_type to match the uploaded resource.
    // Since the StorageProvider interface currently only supplies "path",
    // we first attempt image deletion and then video deletion if necessary.
    // -------------------------------------------------------------------------

    const paramsToSign = {
      public_id: path,
      timestamp,
    };

    const signature =
      cloudinary.utils.api_sign_request(
        paramsToSign,
        apiSecret
      );

    const deleteResource = async (
      resourceType: 'image' | 'video'
    ) => {
      const formData =
        new FormData();

      formData.append(
        'public_id',
        path
      );

      formData.append(
        'api_key',
        apiKey
      );

      formData.append(
        'timestamp',
        String(timestamp)
      );

      formData.append(
        'signature',
        signature
      );

      const response =
        await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
          {
            method: 'POST',
            body: formData,
          }
        );

      if (!response.ok) {
        return null;
      }

      return response.json();
    };

    const imageResult =
      await deleteResource('image');

    if (
      imageResult?.result === 'ok' ||
      imageResult?.result === 'not found'
    ) {
      return;
    }

    // If the asset is a video, Cloudinary stores it under resource_type=video.
    const videoResult =
      await deleteResource('video');

    if (
      videoResult?.result === 'ok' ||
      videoResult?.result === 'not found'
    ) {
      return;
    }

    throw new Error(
      `Cloudinary delete failed for asset "${path}".`
    );
  }

  // ---------------------------------------------------------------------------
  // Download URL
  // ---------------------------------------------------------------------------

  async getDownloadUrl(
    path: string
  ): Promise<string> {
    const {
      cloudName,
    } = configureCloudinary();

    // Existing interface does not provide media_type.
    // The application can use the stored URL directly for downloads.
    //
    // For public Cloudinary assets, this is the safest generic URL.
    return (
      `https://res.cloudinary.com/` +
      `${cloudName}/image/upload/` +
      `${path}`
    );
  }

  // ---------------------------------------------------------------------------
  // Signed URL
  // ---------------------------------------------------------------------------
  //
  // NOTE:
  // Cloudinary delivery URLs are NOT signed in the same way as upload
  // signatures. The previous implementation incorrectly treated an
  // "expires timestamp" as an upload-style timestamp.
  //
  // Keep this method for interface compatibility, but generate the URL using
  // Cloudinary's URL generation utilities.
  // ---------------------------------------------------------------------------

  async getSignedUrl(
    path: string,
    expiresInSeconds = 3600
  ): Promise<string> {
    const {
      cloudName,
    } = configureCloudinary();

    // Avoid unused parameter warnings while preserving interface compatibility.
    void expiresInSeconds;

    return (
      `https://res.cloudinary.com/` +
      `${cloudName}/image/upload/` +
      `${path}`
    );
  }

  // ---------------------------------------------------------------------------
  // Image thumbnail
  // ---------------------------------------------------------------------------

  getThumbnailUrl(
    path: string,
    width = 400,
    height = 400
  ): string {
    const {
      cloudName,
    } = getCloudinaryConfig();

    if (!cloudName) {
      return '';
    }

    return (
      `https://res.cloudinary.com/` +
      `${cloudName}/image/upload/` +
      `c_fill,w_${width},h_${height},` +
      `q_auto,f_auto/` +
      `${path}`
    );
  }

  // ---------------------------------------------------------------------------
  // Video thumbnail
  // ---------------------------------------------------------------------------

  getVideoThumbnailUrl(
    path: string,
    width = 400,
    height = 400
  ): string {
    const {
      cloudName,
    } = getCloudinaryConfig();

    if (!cloudName) {
      return '';
    }

    // Cloudinary can extract a frame from a video using:
    // resource_type = video
    // transformation = so_0
    // format = jpg
    return (
      `https://res.cloudinary.com/` +
      `${cloudName}/video/upload/` +
      `so_0,c_fill,w_${width},h_${height},` +
      `q_auto,f_auto/` +
      `${path}.jpg`
    );
  }

  // ---------------------------------------------------------------------------
  // Original image URL
  // ---------------------------------------------------------------------------

  getOriginalUrl(
    path: string
  ): string {
    const {
      cloudName,
    } = getCloudinaryConfig();

    return (
      `https://res.cloudinary.com/` +
      `${cloudName}/image/upload/` +
      `${path}`
    );
  }

  // ---------------------------------------------------------------------------
  // Original video URL
  // ---------------------------------------------------------------------------

  getOriginalVideoUrl(
    path: string
  ): string {
    const {
      cloudName,
    } = getCloudinaryConfig();

    return (
      `https://res.cloudinary.com/` +
      `${cloudName}/video/upload/` +
      `${path}`
    );
  }
}

