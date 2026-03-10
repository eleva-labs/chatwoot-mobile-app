import { useMemo } from 'react';
import { SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight } from 'react-native-reanimated';
import { contentFadeInLinear, fastFadeOut, timing } from '@infrastructure/animation';
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
          entering: contentFadeInLinear(),
          exiting: fastFadeOut(),
        };

      case 'slide':
        if (direction === 'forward') {
          return {
            entering: SlideInRight.duration(timing.content.duration),
            exiting: SlideOutLeft.duration(timing.fast.duration),
          };
        } else {
          return {
            entering: SlideInLeft.duration(timing.content.duration),
            exiting: SlideOutRight.duration(timing.fast.duration),
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
