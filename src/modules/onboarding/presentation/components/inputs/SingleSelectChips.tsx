import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { TextInput } from './TextInput';
import type { SelectOption } from '../../../domain/common';

interface SingleSelectChipsProps {
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  error?: string;
  allowCustomInput?: boolean;
  onCustomInput?: (value: string) => void;
  customInputPlaceholder?: string;
}

/**
 * Single Select Chips Component
 *
 * Displays options as selectable chips with optional custom input.
 * Memoized for performance optimization.
 */
function SingleSelectChipsComponent({
  options,
  value,
  onChange,
  error,
  allowCustomInput = false,
  onCustomInput,
  customInputPlaceholder,
}: SingleSelectChipsProps) {
  const themedStyles = useThemedStyles();

  const handleOptionPress = useCallback(
    (optionValue: string | number) => {
      onChange(optionValue);
    },
    [onChange],
  );

  const renderedOptions = useMemo(
    () =>
      options.map(option => {
        const isSelected = value === option.value;

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleOptionPress(option.value)}
            style={themedStyles.style(
              'px-4 py-2 rounded-full border',
              isSelected ? 'bg-brand-600 border-brand-600' : 'bg-solid-1 border-slate-7',
            )}
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}>
            <Text
              style={themedStyles.style(
                'text-sm font-medium',
                isSelected ? 'text-white' : 'text-slate-12',
              )}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      }),
    [options, value, handleOptionPress, themedStyles],
  );

  return (
    <View style={themedStyles.style('w-full')}>
      <View style={themedStyles.style('flex-row flex-wrap gap-2')}>{renderedOptions}</View>

      {allowCustomInput && onCustomInput && (
        <View style={themedStyles.style('mt-4')}>
          <TextInput
            value=""
            onChangeText={onCustomInput}
            placeholder={customInputPlaceholder || 'Enter custom value'}
          />
        </View>
      )}

      {error && <Text style={themedStyles.style('text-ruby-500 text-sm mt-2')}>{error}</Text>}
    </View>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SingleSelectChips = memo(SingleSelectChipsComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.options.length === nextProps.options.length &&
    prevProps.options.every(
      (opt, idx) =>
        opt.id === nextProps.options[idx]?.id && opt.value === nextProps.options[idx]?.value,
    )
  );
});
