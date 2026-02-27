import React from 'react';
import { View, Text } from 'react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import type { AIToolIndicatorProps } from '@/presentation/containers/ai-assistant/types';
import i18n from '@/i18n';

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
      accessibilityLabel={i18n.t('AI_ASSISTANT.CHAT.TOOLS.INDICATOR')}>
      <Text style={style('text-sm font-inter-medium-24', slateTokens.labelActive)}>
        {toolCalls.length === 1
          ? i18n.t('AI_ASSISTANT.CHAT.TOOLS.SINGLE')
          : i18n.t('AI_ASSISTANT.CHAT.TOOLS.MULTIPLE', { count: toolCalls.length })}
      </Text>
    </View>
  );
};
