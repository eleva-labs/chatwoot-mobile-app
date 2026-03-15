/**
 * AIChatEmptyState Component
 *
 * Centered empty state matching web AiConversationEmptyState.vue.
 * Includes tappable suggested prompt chips when no active session.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';

// TODO: Re-enable suggested prompt chips when prompt list is finalized

interface AIChatEmptyStateProps {
  hasActiveSession?: boolean;
  onSendPrompt?: (text: string) => void;
}

export const AIChatEmptyState: React.FC<AIChatEmptyStateProps> = ({
  hasActiveSession,
  onSendPrompt,
}) => {
  const { style } = useAIStyles();
  const { t } = useAIi18n();
  const { colors } = useThemeColors();

  return (
    <View style={style('flex-1 items-center justify-center p-8')}>
      {/* Icon container */}
      <View style={style('mb-4 rounded-full bg-slate-2 p-4')}>
        <MessageCircle size={28} color={colors.slate[9]} strokeWidth={2} />
      </View>

      {/* Title */}
      <Text style={style('text-lg font-semibold text-slate-12 mb-2 text-center')}>
        {hasActiveSession
          ? t('AI_ASSISTANT.CHAT.EMPTY_STATE.TITLE_WITH_SESSION')
          : t('AI_ASSISTANT.CHAT.EMPTY_STATE.TITLE_NO_SESSION')}
      </Text>

      {/* Description */}
      <Text style={style('text-sm text-slate-11 text-center max-w-[340px]')}>
        {hasActiveSession
          ? t('AI_ASSISTANT.CHAT.EMPTY_STATE.DESCRIPTION_WITH_SESSION')
          : t('AI_ASSISTANT.CHAT.EMPTY_STATE.DESCRIPTION_NO_SESSION')}
      </Text>
    </View>
  );
};
