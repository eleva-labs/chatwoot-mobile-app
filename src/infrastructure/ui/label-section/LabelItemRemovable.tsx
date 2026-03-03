import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { CloseIcon } from '@/svg-icons/common/CloseIcon';
import { useHaptic } from '@infrastructure/utils';

type LabelItemRemovableProps = {
  title: string;
  color: string;
  onRemove: () => void;
};

export const LabelItemRemovable = ({ title, color, onRemove }: LabelItemRemovableProps) => {
  const themedStyles = useThemedStyles();
  const hapticSelection = useHaptic();

  const handleRemove = () => {
    hapticSelection?.();
    onRemove();
  };

  return (
    <View style={tailwind.style('flex-row')}>
      {/* Label part */}
      <Animated.View
        style={[
          styles.labelShadow,
          tailwind.style('flex-row items-center bg-solid-1 px-3 py-[7px] rounded-l-lg'),
          Platform.OS === 'android' && {
            backgroundColor: tailwind.color('bg-solid-1') ?? 'white',
          },
        ]}>
        {/* Color dot */}
        <Animated.View style={tailwind.style('h-2.5 w-2.5 rounded-full', `bg-[${color}]`)} />

        {/* Label text */}
        <Animated.Text
          numberOfLines={1}
          style={[
            themedStyles.style('text-sm font-inter-420-20 leading-[17px] tracking-[0.24px] ml-2'),
            { color: tailwind.color('text-slate-11') },
          ]}>
          {title}
        </Animated.Text>
      </Animated.View>

      {/* Remove button - separate box */}
      <Pressable
        onPress={handleRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          tailwind.style(
            'flex items-center justify-center rounded-r-lg',
            pressed ? 'bg-slate-4' : 'bg-solid-1',
          ),
          Platform.OS === 'android' && {
            backgroundColor: pressed
              ? tailwind.color('bg-slate-4')
              : (tailwind.color('bg-solid-1') ?? 'white'),
          },
          // Add left border to separate from label
          {
            borderLeftWidth: 1,
            borderLeftColor: tailwind.color('border-slate-6') ?? '#e0e0e0',
            paddingHorizontal: 8,
            paddingVertical: 7,
            minWidth: 28,
          },
        ]}>
        <CloseIcon size={14} color={tailwind.color('text-slate-9')} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  labelShadow:
    Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 0.15 },
        shadowRadius: 2,
        shadowOpacity: 0.35,
        elevation: 2,
      },
      android: {
        elevation: 4,
      },
    }) || {},
});
