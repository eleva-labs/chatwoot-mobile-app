import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import type { PickedAsset } from '@domain/types';

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const IMAGE_COMPRESS_QUALITY = 0.8;

/**
 * Processes an image asset for upload:
 * - Converts HEIC/HEIF images to JPEG (required by WHAPI / WhatsApp)
 * - Compresses all images to reduce upload size
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

  try {
    const isHeic = HEIC_MIME_TYPES.has(mimeType);
    const isPng = mimeType === 'image/png';

    // HEIC → JPEG (unsupported everywhere), PNG → PNG (preserve alpha), others → JPEG
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
    // Only change extension for HEIC→JPEG conversions; PNG keeps its extension
    const updatedFileName = isHeic ? replaceExtension(asset.fileName, '.jpg') : asset.fileName;

    return {
      ...asset,
      uri: result.uri,
      type: outputMimeType,
      fileName: updatedFileName,
      fileSize,
    };
  } catch (error) {
    console.warn('Image conversion failed, using original asset:', error);
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
