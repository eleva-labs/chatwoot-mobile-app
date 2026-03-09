import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import type { PickedAsset } from '@domain/types';

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
 *
 * Uses the SDK 55 context-based ImageManipulator API and new File class.
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
    const isPng = mimeType === 'image/png';

    // HEIC → JPEG, PNG → PNG (preserve alpha), others (WebP, BMP, TIFF) → JPEG
    const outputFormat = isPng ? SaveFormat.PNG : SaveFormat.JPEG;

    // SDK 55 context API: manipulate → renderAsync → saveAsync
    // rotate(0) forces iOS to normalize EXIF orientation into pixel data,
    // preventing rotated output when converting HEIC → JPEG.
    const context = ImageManipulator.manipulate(asset.uri).rotate(0);
    const imageRef = await context.renderAsync();
    const result = await imageRef.saveAsync({
      format: outputFormat,
      // compress is only meaningful for JPEG; PNG is always lossless
      ...(outputFormat === SaveFormat.JPEG && { compress: IMAGE_COMPRESS_QUALITY }),
    });

    // Get actual file size using the new File class (SDK 55 — getInfoAsync is deprecated)
    let fileSize: number | undefined;
    const file = new File(result.uri);
    if (file.exists) {
      fileSize = file.size;
    }

    const outputMimeType = isPng ? 'image/png' : 'image/jpeg';

    // Update extension when format changes (HEIC→.jpg, WebP→.jpg, BMP→.jpg, etc.)
    // PNG keeps its original extension since format doesn't change
    const formatChanged = !isPng && mimeType !== 'image/jpeg' && mimeType !== 'image/jpg';
    const updatedFileName = formatChanged
      ? replaceExtension(asset.fileName, '.jpg')
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
 * Returns the original value when fileName is absent or empty.
 */
export const replaceExtension = (
  fileName: string | undefined,
  newExt: string,
): string | undefined => {
  if (!fileName) return fileName;
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
  return `${baseName}${newExt}`;
};
