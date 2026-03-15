import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANDROID_NAV_BAR_INSET } from '@domain/constants';

/**
 * Returns the effective bottom inset for the chat screen.
 *
 * On iOS this is the safe-area bottom inset (home indicator, ~34pt on notched).
 * On Android, `useSafeAreaInsets().bottom` returns 0 (no edge-to-edge), so we
 * fall back to `ANDROID_NAV_BAR_INSET` to keep UI above the system nav bar.
 *
 * Used by `ReplyBoxContainer` (AnimatedKeyboardStickyView margin) to keep the
 * reply box above the system nav bar when the keyboard is closed.
 *
 * Note: similar logic exists in `useChromeMetrics` (bottomPadding / footerBottomInset)
 * for the tab bar. Kept separate because this hook is chat-screen-specific and
 * returns a single value rather than a full metrics object.
 */
export const useEffectiveBottom = (): number => {
  const { bottom } = useSafeAreaInsets();
  return Platform.OS === 'android' ? Math.max(bottom, ANDROID_NAV_BAR_INSET) : bottom;
};
