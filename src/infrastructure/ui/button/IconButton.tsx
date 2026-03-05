import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useThemeColors } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { useHaptic, useScaleAnimation } from '@infrastructure/utils';
import { Icon } from '../common';
import { PhoneIcon } from '@/svg-icons';

type ButtonProps = {
  isDestructive?: boolean;
  text: string;
  handlePress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

const getButtonStyles = (
  isPrimary: boolean,
  pressed: boolean,
  themedTailwind: ReturnType<typeof import('@/hooks').useThemedStyles>,
) => {
  const baseStyles = 'py-[11px] flex-row items-center justify-center rounded-[13px] gap-4';
  const variantStyles = isPrimary ? 'bg-brand' : 'bg-slate-2';
  const pressedStyles = isPrimary ? 'opacity-95' : pressed ? 'bg-slate-3' : '';

  return themedTailwind.style(baseStyles, variantStyles, pressedStyles);
};

const getTextStyles = (
  isPrimary: boolean,
  isDestructive: boolean,
  themedTailwind: ReturnType<typeof import('@/hooks').useThemedStyles>,
) => {
  const baseStyles = 'text-base font-medium tracking-[0.16px] leading-[22px]';
  const colorStyles = isPrimary
    ? isDestructive
      ? 'text-ruby-11'
      : 'text-white'
    : isDestructive
      ? 'text-ruby-11'
      : 'text-iris-11';

  return themedTailwind.style(baseStyles, colorStyles);
};

export const IconButton = ({
  text,
  isDestructive = false,
  handlePress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const haptic = useHaptic(isDestructive ? 'medium' : 'selection');
  const themedTailwind = useThemedStyles();
  const { semanticColors } = useThemeColors();

  const handleButtonPress = useCallback(() => {
    if (!disabled) {
      haptic?.();
      handlePress?.();
    }
  }, [disabled, handlePress, haptic]);

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handleButtonPress}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => getButtonStyles(isPrimary, pressed, themedTailwind)}
        {...handlers}>
        <Icon icon={<PhoneIcon strokeWidth={2} stroke={semanticColors.textInverse} />} size={24} />
        <Animated.Text style={getTextStyles(isPrimary, isDestructive, themedTailwind)}>
          {text}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
};
