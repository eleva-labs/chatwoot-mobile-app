import { ImageURISource } from 'react-native';

/**
 * Resolves the avatar image source for a message sender.
 *
 * Priority: avatarUrl > thumbnail > undefined (falls back to initials in Avatar component).
 * This consolidates 7+ duplicated avatar patterns across message components.
 */
export const getAvatarSource = (
  sender:
    | { avatarUrl?: string | null; thumbnail?: string | null; type?: string }
    | null
    | undefined,
): ImageURISource | undefined => {
  if (!sender) return undefined;
  const url = sender.avatarUrl || sender.thumbnail;
  return url ? { uri: url } : undefined;
};
