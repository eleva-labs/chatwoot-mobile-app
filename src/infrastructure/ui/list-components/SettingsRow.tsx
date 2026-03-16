import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { CaretRight } from '@/svg-icons/common/CaretRight';
import { tailwind, useThemeColors, textBodyBook, textBodyBase } from '@infrastructure/theme';

type SettingsRowProps = {
  /** Left content — Avatar, Icon, PriorityIndicator, etc. */
  leftContent: React.ReactNode;
  /** Primary label text */
  label: string;
  /** Right-side action text (e.g., "Edit", "Assign") */
  actionText: string;
  /** Whether to apply top-left/top-right rounding */
  isFirstItem?: boolean;
  /** Whether to apply bottom-left/bottom-right rounding (also hides bottom border) */
  isLastItem?: boolean;
  /** Callback when the row is pressed */
  onPress: () => void;
};

export const SettingsRow = ({
  leftContent,
  label,
  actionText,
  isFirstItem = false,
  isLastItem = false,
  onPress,
}: SettingsRowProps) => {
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tailwind.style(
          pressed ? 'bg-slate-3' : '',
          isFirstItem ? 'rounded-t-[13px]' : '',
          isLastItem ? 'rounded-b-[13px]' : '',
        ),
      ]}>
      <Animated.View style={tailwind.style('flex-row items-center justify-between pl-3')}>
        {leftContent}
        <Animated.View
          style={tailwind.style(
            'flex-1 flex-row items-center justify-between py-[11px] ml-[10px]',
            !isLastItem ? 'border-b-[1px] border-b-slate-6' : '',
          )}>
          <Animated.Text
            style={tailwind.style(
              `${textBodyBook} leading-[22px] tracking-[0.16px] text-slate-12 capitalize`,
            )}>
            {label}
          </Animated.Text>
          <Animated.View style={tailwind.style('flex-row items-center pr-3')}>
            <Animated.Text
              style={tailwind.style(
                `${textBodyBase} leading-[22px] tracking-[0.16px] text-slate-12`,
              )}>
              {actionText}
            </Animated.Text>
            <CaretRight size={20} color={colors.slate[12]} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};
