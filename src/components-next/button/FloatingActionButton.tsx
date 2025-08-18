import React, { useCallback, useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { tailwind } from '@/theme';
import { useHaptic, useTabBarHeight } from '@/utils';
import { Icon } from '@/components-next/common';
import aiIcon from '@/assets/images/person_icon.png';

type FloatingActionButtonProps = {
  onPress?: () => void;
  icon?: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
};

export const FloatingActionButton = ({
  onPress,
  icon,
  size = 56,
  backgroundColor = '#5d17eb', // Brand purple
  iconColor = '#ffffff', // White tint for AI icon
  disabled = false,
}: FloatingActionButtonProps) => {
  const { bottom } = useSafeAreaInsets();
  const navigation = useNavigation();
  const haptic = useHaptic('selection');
  const tabBarHeight = useTabBarHeight();

  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Track if we're on the conversation screen
  const isVisible = useSharedValue(1);

  // Listen for navigation events to hide/show FAB
  useFocusEffect(
    useCallback(() => {
      // Show FAB when screen comes into focus
      isVisible.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      return () => {
        // Hide FAB when screen loses focus
        isVisible.value = withTiming(0, {
          duration: 200,
        });
      };
    }, [isVisible]),
  );

  // Handle navigation state changes to hide FAB when entering chat
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      isVisible.value = withTiming(0, {
        duration: 150,
      });
    });

    return unsubscribe;
  }, [navigation, isVisible]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      haptic?.();

      // Scale animation on press
      scale.value = withSpring(0.9, { damping: 15 }, () => {
        scale.value = withSpring(1, { damping: 15 });
      });

      onPress?.();
    }
  }, [disabled, haptic, onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateYValue = interpolate(isVisible.value, [0, 1], [100, 0], Extrapolate.CLAMP);

    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value + translateYValue }],
      opacity: opacity.value * isVisible.value,
    };
  });

  const containerStyle = {
    position: 'absolute' as const,
    bottom: bottom + tabBarHeight + 20, // Position above tab bar dynamically
    right: 20,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Floating action button"
        style={tailwind.style(
          'flex-1 items-center justify-center rounded-full',
          disabled && 'opacity-50',
        )}>
        {icon ? (
          <Icon icon={icon} size={32} />
        ) : (
          <Image
            source={aiIcon}
            style={{
              width: 32,
              height: 32,
              tintColor: iconColor,
            }}
            contentFit="contain"
          />
        )}
      </Pressable>
    </Animated.View>
  );
};
