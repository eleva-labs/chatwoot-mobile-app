import React from 'react';
import Animated from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useScaleAnimation } from '@infrastructure/utils';
import { tailwind } from '@infrastructure/theme';
import { VoiceRecordButtonProps } from '../types';
import {
  voiceNoteIconEnterAnimation,
  voiceNoteIconExitAnimation,
} from '@infrastructure/utils/customAnimations';

export const VoiceRecordButton = (props: VoiceRecordButtonProps) => {
  const { animatedStyle, handlers } = useScaleAnimation();

  return (
    <Pressable {...props} {...handlers}>
      <Animated.View
        entering={voiceNoteIconEnterAnimation}
        exiting={voiceNoteIconExitAnimation}
        style={[
          tailwind.style('flex items-center justify-center h-10 w-10 rounded-2xl'),
          animatedStyle,
        ]}>
        <Mic size={20} strokeWidth={2} color={tailwind.color('text-slate-11') ?? '#60646C'} />
      </Animated.View>
    </Pressable>
  );
};
