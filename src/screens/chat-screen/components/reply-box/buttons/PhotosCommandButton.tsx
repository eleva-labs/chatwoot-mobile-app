import React from 'react';
import Animated from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Icon } from '@infrastructure/ui/common';
import { PhotosIcon } from '@/svg-icons';
import { useScaleAnimation } from '@infrastructure/utils';
import { tailwind } from '@infrastructure/theme';
import { PhotosCommandButtonProps } from '../types';
import {
  photoIconEnterAnimation,
  photoIconExitAnimation,
} from '@infrastructure/utils/customAnimations';

export const PhotosCommandButton = (props: PhotosCommandButtonProps) => {
  const { animatedStyle, handlers } = useScaleAnimation();

  return (
    <Pressable
      {...props}
      {...handlers}
      style={({ pressed }) => [tailwind.style(pressed ? 'opacity-70' : '')]}>
      <Animated.View
        entering={photoIconEnterAnimation}
        exiting={photoIconExitAnimation}
        style={[
          tailwind.style('flex items-center justify-center h-10 w-10 rounded-2xl'),
          animatedStyle,
        ]}>
        <Icon icon={<PhotosIcon />} size={24} />
      </Animated.View>
    </Pressable>
  );
};
