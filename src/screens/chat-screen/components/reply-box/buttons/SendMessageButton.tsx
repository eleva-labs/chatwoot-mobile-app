import React from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { useScaleAnimation } from '@infrastructure/utils';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import { useAppSelector, useThemedStyles } from '@/hooks';
import { selectIsPrivateMessage } from '@application/store/conversation/sendMessageSlice';
import { SendMessageButtonProps } from '../types';
import {
  sendIconEnterAnimation,
  sendIconExitAnimation,
} from '@infrastructure/utils/customAnimations';

export const SendMessageButton = (props: SendMessageButtonProps) => {
  const { animatedStyle, handlers } = useScaleAnimation();
  const themedTailwind = useThemedStyles();
  const { semanticColors } = useThemeColors();
  const isPrivateMessage = useAppSelector(selectIsPrivateMessage);

  return (
    <Pressable {...props} {...handlers}>
      <Animated.View
        layout={LinearTransition.springify().damping(28).stiffness(200)}
        entering={sendIconEnterAnimation}
        exiting={sendIconExitAnimation}
        style={[tailwind.style('flex items-center justify-center h-10 w-10'), animatedStyle]}>
        <Animated.View
          style={themedTailwind.style(
            'flex items-center justify-center h-7 w-7 rounded-full',
            isPrivateMessage ? 'bg-amber-9' : 'bg-slate-12',
          )}>
          <ArrowUp size={16} strokeWidth={2} color={semanticColors.textInverse} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};
