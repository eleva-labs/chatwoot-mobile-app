import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useRefsContext } from '@infrastructure/context';

import { CaretBottomSmall } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { useHaptic, useScaleAnimation } from '@infrastructure/utils';

type FilterButtonProps = {
  value: string;
  handleOnPress: () => void;
};

export const FilterButton = (props: FilterButtonProps) => {
  const { value, handleOnPress } = props;
  const { handlers, animatedStyle } = useScaleAnimation();
  const { filtersModalSheetRef } = useRefsContext();

  const hapticSelection = useHaptic();

  const onPress = useCallback(() => {
    hapticSelection?.();
    filtersModalSheetRef.current?.present();
    handleOnPress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={tailwind.style('px-3 py-[7px] rounded-lg bg-slate-3 flex flex-row items-center')}
        onPress={onPress}
        {...handlers}>
        <Animated.Text
          style={tailwind.style(
            'text-sm font-inter-medium-24 leading-[16px] tracking-[0.24px] pr-1 capitalize text-slate-12',
          )}>
          {value}
        </Animated.Text>
        <Animated.View
          style={[
            tailwind.style('flex items-center justify-center'),
            { height: 16, alignSelf: 'center' },
          ]}>
          <CaretBottomSmall size={16} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};
