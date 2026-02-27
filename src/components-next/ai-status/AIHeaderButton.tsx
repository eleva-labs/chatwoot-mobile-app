import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { tailwind } from '@/theme';

interface AIHeaderButtonProps {
  isEnabled: boolean;
  onPress: () => void;
}

export const AIHeaderButton: React.FC<AIHeaderButtonProps> = ({ isEnabled, onPress }) => {
  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: isEnabled
            ? (tailwind.color('bg-brand') ?? '#5d17ea')
            : (tailwind.color('bg-gray-4') ?? '#e8e8e8'),
        },
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={isEnabled ? 'AI enabled - tap to disable' : 'AI disabled - tap to enable'}
      accessibilityRole="button"
      hitSlop={8}>
      <Text
        style={[
          styles.text,
          {
            color: isEnabled
              ? (tailwind.color('text-white') ?? '#FFFFFF')
              : (tailwind.color('text-gray-11') ?? '#646464'),
          },
        ]}>
        AI
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 28,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
