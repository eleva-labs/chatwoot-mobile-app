/**
 * Represents a picked file attachment from image picker or document picker.
 *
 * This type abstracts over the asset shapes returned by expo-image-picker
 * and react-native-document-picker, providing a unified interface for
 * the attachment pipeline (validation, Redux store, UI rendering).
 */
export type PickedAsset = {
  fileName?: string;
  fileSize?: number;
  type?: string;
  uri?: string;
  /** Video duration in seconds (converted from expo-image-picker milliseconds) */
  duration?: number;
};
