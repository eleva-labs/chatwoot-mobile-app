/**
 * AIChatEmptyState Component
 *
 * Centered empty state matching web AiConversationEmptyState.vue.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from '@/components-next/common';
import { ChatIcon } from '@/svg-icons';
import { tailwind } from '@/theme/tailwind';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

interface AIChatEmptyStateProps {
  hasActiveSession?: boolean;
}

export const AIChatEmptyState: React.FC<AIChatEmptyStateProps> = ({ hasActiveSession }) => {
  const { style } = useAIStyles();

  return (
    <View style={style('flex-1 items-center justify-center p-8')}>
      {/* Icon container */}
      <View style={style('mb-4 rounded-full bg-slate-2 p-4')}>
        <Icon icon={<ChatIcon stroke={tailwind.color('text-slate-9') ?? '#8B8D98'} />} size={28} />
      </View>

      {/* Title */}
      <Text style={style('text-lg font-semibold text-slate-12 mb-2 text-center')}>
        {hasActiveSession ? 'No messages yet' : 'Start a conversation'}
      </Text>

      {/* Description */}
      <Text style={style('text-sm text-slate-11 text-center max-w-[340px]')}>
        {hasActiveSession
          ? 'This conversation is empty'
          : 'Ask a question or describe what you need help with'}
      </Text>
    </View>
  );
};
