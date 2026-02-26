/**
 * AIChatEmptyState Component
 *
 * Centered empty state matching web AiConversationEmptyState.vue.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

interface AIChatEmptyStateProps {
  hasActiveSession?: boolean;
}

export const AIChatEmptyState: React.FC<AIChatEmptyStateProps> = ({ hasActiveSession }) => {
  const { style } = useAIStyles();

  return (
    <View style={style('flex-1 items-center justify-center p-8')}>
      {/* Icon container */}
      <View style={style('mb-4 rounded-full bg-slate-3 p-4')}>
        <Text style={style('text-2xl')}>💬</Text>
      </View>

      {/* Title */}
      <Text style={style('text-lg font-semibold text-slate-12 mb-2 text-center')}>
        {hasActiveSession ? 'No messages yet' : 'Start a conversation'}
      </Text>

      {/* Description */}
      <Text style={style('text-sm text-slate-11 text-center max-w-[300px]')}>
        {hasActiveSession
          ? 'This conversation is empty'
          : 'Ask a question or describe what you need help with'}
      </Text>
    </View>
  );
};
