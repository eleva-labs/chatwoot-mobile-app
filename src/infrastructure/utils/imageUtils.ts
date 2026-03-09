import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import type { PickedAsset } from '@domain/types';

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/** MIME types that should skip processing entirely (already optimal or would lose data) */
const PASSTHROUGH_MIME_TYPES = new Set(['image/gif', 'image/jpeg', 'image/jpg']);

const IMAGE_COMPRESS_QUALITY = 0.8;

/**
 * Processes an image asset for upload:
 * - Converts HEIC/HEIF images to JPEG (required by WHAPI / WhatsApp)
 * - Converts other non-standard formats (WebP, BMP, TIFF) to JPEG
 * - Preserves PNG alpha channel (PNG → PNG)
 * - Passes through GIF (preserves animation) and JPEG (avoids lossy re-encode)
 * - Non-image assets (video, audio, documents) are returned unchanged
 */
export const processImageForUpload = async (asset: PickedAsset): Promise<PickedAsset> => {
  const mimeType = asset.type?.toLowerCase() ?? '';

  // Only process images — return videos, audio, documents unchanged
  if (!mimeType.startsWith('image/')) {
    return asset;
  }

  if (!asset.uri) {
    return asset;
  }

  // GIF: skip to preserve animation; JPEG: skip to avoid lossy re-encoding
  if (PASSTHROUGH_MIME_TYPES.has(mimeType)) {
    return asset;
  }

  try {
    const isHeic = HEIC_MIME_TYPES.has(mimeType);
    const isPng = mimeType === 'image/png';

    // HEIC → JPEG, PNG → PNG (preserve alpha), others (WebP, BMP, TIFF) → JPEG
    const outputFormat = isPng ? SaveFormat.PNG : SaveFormat.JPEG;

    const result = await manipulateAsync(asset.uri, [], {
      compress: IMAGE_COMPRESS_QUALITY,
      format: outputFormat,
    });

    // Get actual file size after manipulation (manipulateAsync doesn't return it)
    let fileSize: number | undefined;
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      fileSize = fileInfo.size;
    }

    const outputMimeType = isPng ? 'image/png' : 'image/jpeg';

    // Update extension when format changes (HEIC→.jpg, WebP→.jpg, BMP→.jpg, etc.)
    // PNG keeps its original extension since format doesn't change
    const formatChanged = !isPng && mimeType !== 'image/jpeg' && mimeType !== 'image/jpg';
    const updatedFileName = formatChanged
      ? replaceExtension(asset.fileName, isPng ? '.png' : '.jpg')
      : asset.fileName;

    return {
      ...asset,
      uri: result.uri,
      type: outputMimeType,
      fileName: updatedFileName,
      fileSize,
    };
  } catch (error) {
    const name = asset.fileName ?? 'unknown';
    console.warn(`Image conversion failed for "${name}" (${mimeType}), using original:`, error);
    return asset;
  }
};

/**
 * Replaces the file extension while preserving the base name.
 * Returns the original value when fileName is absent.
 */
const replaceExtension = (fileName: string | undefined, newExt: string): string | undefined => {
  if (!fileName) return fileName;
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
  return `${baseName}${newExt}`;
};
