import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANDROID_NAV_BAR_INSET } from '@domain/constants/chrome';

/**
 * Returns the `bottomInset` prop value for @gorhom/bottom-sheet modals.
 *
 * On Android (edge-to-edge), `useSafeAreaInsets().bottom` returns ~48dp,
 * which lifts the sheet above the transparent system navigation bar.
 * On non-edge-to-edge Android (bottom=0), falls back to ANDROID_NAV_BAR_INSET (8).
 *
 * On iOS, returns 0 — bottom-sheet already handles safe area internally
 * for non-detached sheets, so no additional inset is needed.
 */
export const useBottomSheetInset = (): number => {
  const { bottom } = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return 0;
  }

  return Math.max(bottom, ANDROID_NAV_BAR_INSET);
};
