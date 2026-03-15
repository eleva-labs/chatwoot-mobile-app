import React from 'react';
import { View, Text } from 'react-native';
import { textLabel } from '@infrastructure/theme';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import type { AIToolIndicatorProps } from '@presentation/ai-chat/containers/ai-assistant/types';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';

export const AIToolIndicator: React.FC<AIToolIndicatorProps> = ({ toolCalls }) => {
  const { style, getCollapsible } = useAIStyles();
  const { t } = useAIi18n();
  const slateTokens = getCollapsible('slate');

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <View
      style={style('px-3 py-2 rounded-lg mb-2', slateTokens.background)}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('AI_ASSISTANT.CHAT.TOOLS.INDICATOR')}>
      <Text style={style(textLabel, slateTokens.labelActive)}>
        {toolCalls.length === 1
          ? t('AI_ASSISTANT.CHAT.TOOLS.SINGLE')
          : t('AI_ASSISTANT.CHAT.TOOLS.MULTIPLE', { count: toolCalls.length })}
      </Text>
    </View>
  );
};
