import React, { useState } from 'react';
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
}: TextInputProps) {
  const themedStyles = useThemedStyles();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={themedStyles.style('w-full')}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themedStyles.color('text-gray-400')}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={themedStyles.style(
          'w-full px-4 py-3 rounded-lg border',
          error
            ? 'border-ruby-500 bg-ruby-50'
            : isFocused
              ? 'border-brand-600 bg-white'
              : 'border-gray-300 bg-white',
          multiline && 'min-h-[100px]',
        )}
        accessible
        accessibilityLabel={placeholder || 'Text input'}
        accessibilityHint={required ? 'Required field' : 'Optional field'}
        accessibilityState={{ invalid: !!error }}
      />
      {error && <Text style={themedStyles.style('text-ruby-500 text-sm mt-1')}>{error}</Text>}
    </View>
  );
}
