import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { tailwind } from '@/theme';
import { BotIcon } from '@/svg-icons';

interface AIHeaderButtonProps {
  isEnabled: boolean;
  onPress: () => void;
}

export const AIHeaderButton: React.FC<AIHeaderButtonProps> = ({ isEnabled, onPress }) => {
  const backgroundColor = isEnabled
    ? (tailwind.color('bg-brand') ?? '#5d17ea')
    : (tailwind.color('bg-slate-3') ?? '#e8e8e8');
  const textColor = isEnabled
    ? '#FFFFFF'
    : (tailwind.color('text-slate-11') ?? '#646464');

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
      <Text
        style={[
          tailwind.style('text-sm font-inter-medium-24'),
          { color: textColor },
        ]}>
        AI
      </Text>
    </Pressable>
  );
};
