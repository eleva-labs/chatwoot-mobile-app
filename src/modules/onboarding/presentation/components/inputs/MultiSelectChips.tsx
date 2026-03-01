import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { SelectOption } from '../../../domain/common';

interface MultiSelectChipsProps {
  options: SelectOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  error?: string;
  maxSelection?: number;
}

/**
 * Multi Select Chips Component
 *
 * Displays options as selectable chips with multi-selection support.
 * Memoized for performance optimization.
 */
function MultiSelectChipsComponent({
  options,
  value,
  onChange,
  error,
  maxSelection,
}: MultiSelectChipsProps) {
  const themedStyles = useThemedStyles();

  const handleToggle = useCallback(
    (optionValue: string | number) => {
      const currentValue = value || [];
      const isSelected = currentValue.includes(optionValue);

      if (isSelected) {
        // Remove from selection
        onChange(currentValue.filter(v => v !== optionValue));
      } else {
        // Add to selection (check max selection)
        if (maxSelection && currentValue.length >= maxSelection) {
          return; // Don't add if max selection reached
        }
        onChange([...currentValue, optionValue]);
      }
    },
    [value, onChange, maxSelection],
  );

  const renderedOptions = useMemo(
    () =>
      options.map(option => {
        const isSelected = (value || []).includes(option.value);
        const isDisabled = Boolean(
          maxSelection && !isSelected && (value || []).length >= maxSelection,
        );

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleToggle(option.value)}
            disabled={isDisabled}
            style={themedStyles.style(
              'px-4 py-2 rounded-full border',
              isSelected
                ? 'bg-brand-600 border-brand-600'
                : isDisabled
                  ? 'bg-slate-3 border-slate-6 opacity-50'
                  : 'bg-solid-1 border-slate-7',
            )}
            accessible
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: isSelected,
              disabled: isDisabled,
            }}
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
    [options, value, maxSelection, handleToggle, themedStyles],
  );

  return (
    <View style={themedStyles.style('w-full')}>
      <View style={themedStyles.style('flex-row flex-wrap gap-2')}>{renderedOptions}</View>

      {maxSelection && (
        <Text style={themedStyles.style('text-slate-9 text-xs mt-2')}>
          {value?.length || 0} / {maxSelection} selected
        </Text>
      )}

      {error && <Text style={themedStyles.style('text-ruby-500 text-sm mt-2')}>{error}</Text>}
    </View>
  );
}

// Memoize component to prevent unnecessary re-renders
export const MultiSelectChips = memo(MultiSelectChipsComponent, (prevProps, nextProps) => {
  const prevValue = prevProps.value || [];
  const nextValue = nextProps.value || [];

  return (
    prevValue.length === nextValue.length &&
    prevValue.every(v => nextValue.includes(v)) &&
    prevProps.error === nextProps.error &&
    prevProps.maxSelection === nextProps.maxSelection &&
    prevProps.options.length === nextProps.options.length &&
    prevProps.options.every(
      (opt, idx) =>
        opt.id === nextProps.options[idx]?.id && opt.value === nextProps.options[idx]?.value,
    )
  );
});
