import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@domain/constants';

export const useTabBarHeight = () => {
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    return TAB_BAR_HEIGHT;
  }

  // Base = TAB_BAR_HEIGHT minus the iOS safe-area allocation (32px).
  // This gives us the fixed portion (content + top padding = 51px).
  // Then we add back the actual bottom padding, which differs per platform.
  const baseHeight = TAB_BAR_HEIGHT - 32;
  const bottomPadding = Math.max(bottom, 32);
  return baseHeight + bottomPadding;
};
