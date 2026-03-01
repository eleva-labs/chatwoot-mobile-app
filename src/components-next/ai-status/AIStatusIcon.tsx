import React from 'react';
import { View } from 'react-native';
import { AIOnIcon } from '@/svg-icons';

interface AIStatusIconProps {
  isEnabled: boolean;
  size?: number;
}

export const AIStatusIcon: React.FC<AIStatusIconProps> = ({ isEnabled, size = 16 }) => {
  if (!isEnabled) {
    return null;
  }

  return (
    <View
      accessible={true}
      accessibilityLabel="AI enabled"
      accessibilityRole="image"
      style={{ width: size, height: size }}>
      <AIOnIcon size={size} />
    </View>
  );
};
