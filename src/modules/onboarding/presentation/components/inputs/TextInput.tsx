import React, { useState, useMemo } from 'react';
import { View, Text, TextInput as RNTextInput } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  warningThreshold?: number; // 0.0-1.0, default 0.9
}

/**
 * Text Input Component for onboarding
 */
export function TextInput({
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  multiline = false,
  numberOfLines = 1,
  autoFocus = false,
  maxLength,
  showCharacterCount = false,
  warningThreshold = 0.9,
}: TextInputProps) {
  const themedStyles = useThemedStyles();
  const [isFocused, setIsFocused] = useState(false);

  // Calculate character count status
  const characterCountStatus = useMemo(() => {
    if (!maxLength || !showCharacterCount) return null;

    const currentLength = value.length;
    const remaining = maxLength - currentLength;
    const percentage = currentLength / maxLength;
    const isWarning = percentage >= warningThreshold;
    const isError = currentLength >= maxLength;

    return {
      remaining,
      percentage,
      isWarning,
      isError,
    };
  }, [value, maxLength, showCharacterCount, warningThreshold]);

  return (
    <View style={themedStyles.style('w-full')}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themedStyles.color('text-slate-9')}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={themedStyles.style(
          'w-full px-4 py-3 rounded-lg border',
          error
            ? 'border-ruby-8 bg-ruby-3'
            : isFocused
              ? 'border-brand bg-solid-1'
              : 'border-slate-7 bg-solid-1',
          multiline && 'min-h-[100px]',
        )}
        accessible
        accessibilityLabel={placeholder || 'Text input'}
        accessibilityHint={required ? 'Required field' : 'Optional field'}
        aria-invalid={!!error}
      />

      {/* Character counter */}
      {characterCountStatus && (
        <Text
          style={themedStyles.style(
            'text-xs mt-1 text-right',
            characterCountStatus.isError
              ? 'text-ruby-11 font-semibold'
              : characterCountStatus.isWarning
                ? 'text-orange-500 font-medium'
                : 'text-slate-9',
          )}
          accessible
          accessibilityLabel={`${characterCountStatus.remaining} characters remaining`}>
          {characterCountStatus.remaining} character
          {characterCountStatus.remaining !== 1 ? 's' : ''} remaining
        </Text>
      )}

      {/* Error message */}
      {error && <Text style={themedStyles.style('text-ruby-11 text-sm mt-1')}>{error}</Text>}
    </View>
  );
}
