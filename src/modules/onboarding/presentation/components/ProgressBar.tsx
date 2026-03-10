import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { timing } from '@infrastructure/animation';
import { useThemedStyles } from '@infrastructure/hooks/useThemedStyles';

interface ProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
}

/**
 * Progress Bar Component with Animation
 *
 * Displays the progress of the onboarding flow with smooth animations.
 */
export function ProgressBar({
  progress,
  showPercentage = false,
  height = 4,
  animated = true,
}: ProgressBarProps) {
  const themedStyles = useThemedStyles();
  const width = useSharedValue(0);

  const clampedProgress: number = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    if (animated) {
      width.value = withTiming(clampedProgress, timing.content);
    } else {
      width.value = clampedProgress;
    }
  }, [clampedProgress, animated, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={themedStyles.style('w-full mb-4')}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
      }}>
      <View
        style={[themedStyles.style('w-full bg-slate-4 rounded-full overflow-hidden'), { height }]}>
        <Animated.View
          style={[themedStyles.style('bg-brand h-full rounded-full'), animatedStyle]}
        />
      </View>
      {showPercentage && (
        <Text style={themedStyles.style('text-sm text-slate-10 mt-1 text-right')}>
          {Math.round(clampedProgress)}%
        </Text>
      )}
    </View>
  );
}
