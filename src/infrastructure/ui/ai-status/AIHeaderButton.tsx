import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { tailwind, useThemeColors, textLabel } from '@infrastructure/theme';
import { BotIcon } from '@/svg-icons';

interface AIHeaderButtonProps {
  isEnabled: boolean;
  onPress: () => void;
}

export const AIHeaderButton: React.FC<AIHeaderButtonProps> = ({ isEnabled, onPress }) => {
  const { colors, semanticColors } = useThemeColors();
  const backgroundColor = isEnabled ? colors.iris[9] : colors.slate[3];
  const textColor = isEnabled ? semanticColors.textInverse : colors.slate[11];

  return (
    <Pressable
      style={[
        tailwind.style('flex-row items-center gap-1.5 h-8 px-3 rounded-lg'),
        { backgroundColor },
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={isEnabled ? 'AI enabled - tap to disable' : 'AI disabled - tap to enable'}
      accessibilityRole="button"
      hitSlop={8}>
      <View style={tailwind.style('w-4 h-4')}>
        <BotIcon stroke={textColor} size={16} />
      </View>
      <Text style={[tailwind.style(textLabel), { color: textColor }]}>AI</Text>
    </Pressable>
  );
};
