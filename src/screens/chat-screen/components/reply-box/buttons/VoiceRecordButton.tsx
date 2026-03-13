import React from 'react';
import Animated from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useScaleAnimation } from '@infrastructure/utils';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import { VoiceRecordButtonProps } from '../types';
import {
  voiceNoteIconEnterAnimation,
  voiceNoteIconExitAnimation,
} from '@infrastructure/utils/customAnimations';

export const VoiceRecordButton = (props: VoiceRecordButtonProps) => {
  const { animatedStyle, handlers } = useScaleAnimation();
  const { colors } = useThemeColors();

  return (
    <Pressable {...props} {...handlers}>
      <Animated.View
        entering={voiceNoteIconEnterAnimation}
        exiting={voiceNoteIconExitAnimation}
        style={[
          tailwind.style('flex items-center justify-center h-12 w-12 rounded-2xl'),
          animatedStyle,
        ]}>
        <Mic size={26} strokeWidth={2} color={colors.slate[11]} />
      </Animated.View>
    </Pressable>
  );
};
