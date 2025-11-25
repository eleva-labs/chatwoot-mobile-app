import React from 'react';
import { View, Text } from 'react-native';
import { useThemedStyles } from '@/hooks';
import type { AIToolIndicatorProps } from './types';

export const AIToolIndicator: React.FC<AIToolIndicatorProps> = ({ toolCalls }) => {
  const themedTailwind = useThemedStyles();

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <View
      style={themedTailwind.style('px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2')}
      accessible
      accessibilityRole="text"
      accessibilityLabel="AI tool call indicator">
      <Text
        style={themedTailwind.style(
          'text-sm font-inter-medium-24 text-blue-700 dark:text-blue-300',
        )}>
        {toolCalls.length === 1 ? 'Using tool...' : `Using ${toolCalls.length} tools...`}
      </Text>
    </View>
  );
};
