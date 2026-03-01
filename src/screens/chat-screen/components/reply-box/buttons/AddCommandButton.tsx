import React from 'react';
import Animated, { LinearTransition, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useScaleAnimation } from '@/utils';
import { tailwind } from '@/theme';
import { AddCommandButtonProps } from '../types';

export const AddCommandButton = ({
  derivedAddMenuOptionStateValue,
  ...otherProps
}: AddCommandButtonProps) => {
  const { animatedStyle, handlers } = useScaleAnimation();

  const addIconAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(derivedAddMenuOptionStateValue.value, [0, 1], [0, 45])}deg`,
        },
      ],
    };
  });

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(180)}
      style={animatedStyle}>
      <Pressable
        {...otherProps}
        style={({ pressed }) => [tailwind.style(pressed ? 'opacity-70' : '')]}
        {...handlers}>
        <Animated.View
          style={[
            tailwind.style('flex items-center justify-center h-10 w-10 rounded-2xl'),
            addIconAnimation,
          ]}>
          <Plus size={20} strokeWidth={2} color={tailwind.color('text-slate-11') ?? '#60646C'} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};
