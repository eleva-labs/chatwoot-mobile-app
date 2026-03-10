import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue, withSpring } from 'react-native-reanimated';

import { spring } from '@infrastructure/animation';

export const useAppKeyboardAnimation = () => {
  const progress = useSharedValue(0);
  const height = useSharedValue(0);
  useKeyboardHandler({
    onStart: e => {
      'worklet';
      progress.value = withSpring(e.progress, spring.keyboard);
      height.value = withSpring(e.height, spring.keyboard);
    },
  });

  return { height, progress };
};
