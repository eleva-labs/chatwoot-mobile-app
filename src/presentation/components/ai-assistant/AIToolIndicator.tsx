import React from 'react';
import { View, Text } from 'react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import type { AIToolIndicatorProps } from '@/presentation/containers/ai-assistant/types';

export const AIToolIndicator: React.FC<AIToolIndicatorProps> = ({ toolCalls }) => {
  const { style, getCollapsible } = useAIStyles();
  const slateTokens = getCollapsible('slate');

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <View
      style={style('px-3 py-2 rounded-lg mb-2', slateTokens.background)}
      accessible
      accessibilityRole="text"
      accessibilityLabel="AI tool call indicator">
      <Text style={style('text-sm font-inter-medium-24', slateTokens.labelActive)}>
        {toolCalls.length === 1 ? 'Using tool...' : `Using ${toolCalls.length} tools...`}
      </Text>
    </View>
  );
};
