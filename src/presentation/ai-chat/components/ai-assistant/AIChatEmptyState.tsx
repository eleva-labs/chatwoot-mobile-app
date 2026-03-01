/**
 * AIChatEmptyState Component
 *
 * Centered empty state matching web AiConversationEmptyState.vue.
 * Includes tappable suggested prompt chips when no active session.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useResolveColor } from '@presentation/ai-chat/hooks/ai-assistant/useAITheme';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';

// TODO: Re-enable when prompt list is finalized (see JSX comment below)
// const SUGGESTED_PROMPT_KEYS = [
//   'AI_ASSISTANT.CHAT.SUGGESTED_PROMPTS.SUMMARIZE',
//   'AI_ASSISTANT.CHAT.SUGGESTED_PROMPTS.DRAFT',
//   'AI_ASSISTANT.CHAT.SUGGESTED_PROMPTS.CAPABILITIES',
// ] as const;

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
  const resolveColor = useResolveColor();

  return (
    <View style={style('flex-1 items-center justify-center p-8')}>
      {/* Icon container */}
      <View style={style('mb-4 rounded-full bg-slate-2 p-4')}>
        <MessageCircle size={28} color={resolveColor('text-slate-9', '#8B8D98')} strokeWidth={2} />
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

      {/* TODO: Re-enable suggestion chips when prompt list is finalized
      {!hasActiveSession && onSendPrompt && (
        <View style={style('mt-6 gap-2 w-full max-w-[340px]')}>
          {SUGGESTED_PROMPT_KEYS.map(key => {
            const prompt = t(key);
            return (
              <Pressable
                key={key}
                onPress={() => onSendPrompt(prompt)}
                accessibilityRole="button"
                accessibilityLabel={prompt}
                style={({ pressed }) =>
                  style(
                    'px-4 py-3 rounded-xl border border-slate-6 bg-slate-2',
                    pressed && 'bg-slate-3',
                  )
                }>
                <Text style={style('text-sm text-slate-11')}>{prompt}</Text>
              </Pressable>
            );
          })}
        </View>
      )} */}
    </View>
  );
};
