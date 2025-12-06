import { useMemo } from 'react';
import {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import type { UIConfig } from '../../domain/common';

type AnimationType = 'slide' | 'fade' | 'none';

/**
 * Hook for screen transition animations
 *
 * Returns entering and exiting animations based on configuration.
 */
export function useScreenTransition(
  direction: 'forward' | 'backward' = 'forward',
  uiConfig?: UIConfig,
) {
  const animationType: AnimationType = (uiConfig?.animation as AnimationType) || 'slide';

  const animations = useMemo(() => {
    switch (animationType) {
      case 'fade':
        return {
          entering: FadeIn.duration(300),
          exiting: FadeOut.duration(200),
        };

      case 'slide':
        if (direction === 'forward') {
          return {
            entering: SlideInRight.duration(300),
            exiting: SlideOutLeft.duration(200),
          };
        } else {
          return {
            entering: SlideInLeft.duration(300),
            exiting: SlideOutRight.duration(200),
          };
        }

      case 'none':
      default:
        return {
          entering: undefined,
          exiting: undefined,
        };
    }
  }, [animationType, direction]);

  return animations;
}
