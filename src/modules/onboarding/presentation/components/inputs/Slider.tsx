import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  unit?: string;
  error?: string;
}

/**
 * Slider Input Component
 *
 * Displays a slider for numeric input.
 */
export function SliderInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  unit,
  error,
}: SliderInputProps) {
  const themedStyles = useThemedStyles();

  return (
    <View style={themedStyles.style('w-full')}>
      <View style={themedStyles.style('flex-row items-center justify-between mb-2')}>
        {showValue && (
          <Text style={themedStyles.style('text-lg font-semibold text-slate-12')}>
            {value} {unit || ''}
          </Text>
        )}
      </View>

      <Slider
        value={value}
        onValueChange={onChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={themedStyles.color('bg-brand-600')}
        maximumTrackTintColor={themedStyles.color('bg-slate-5')}
        thumbTintColor={themedStyles.color('bg-brand-600')}
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{
          min,
          max,
          now: value,
        }}
      />

      <View style={themedStyles.style('flex-row justify-between mt-1')}>
        <Text style={themedStyles.style('text-xs text-slate-9')}>
          {min} {unit || ''}
        </Text>
        <Text style={themedStyles.style('text-xs text-slate-9')}>
          {max} {unit || ''}
        </Text>
      </View>

      {error && <Text style={themedStyles.style('text-ruby-500 text-sm mt-2')}>{error}</Text>}
    </View>
  );
}
