/**
 * AIChatEmptyState Component
 *
 * Centered empty state matching web AiConversationEmptyState.vue.
 * Includes tappable suggested prompt chips when no active session.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '@/components-next/common';
import { ChatIcon } from '@/svg-icons';
import { tailwind } from '@/theme/tailwind';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import i18n from '@/i18n';

const SUGGESTED_PROMPT_KEYS = [
  'AI_ASSISTANT.CHAT.SUGGESTED_PROMPTS.SUMMARIZE',
  'AI_ASSISTANT.CHAT.SUGGESTED_PROMPTS.DRAFT',
  'AI_ASSISTANT.CHAT.SUGGESTED_PROMPTS.CAPABILITIES',
] as const;

interface AIChatEmptyStateProps {
  hasActiveSession?: boolean;
  onSendPrompt?: (text: string) => void;
}

export const AIChatEmptyState: React.FC<AIChatEmptyStateProps> = ({
  hasActiveSession,
  onSendPrompt,
}) => {
  const { style } = useAIStyles();

  return (
    <View style={style('flex-1 items-center justify-center p-8')}>
      {/* Icon container */}
      <View style={style('mb-4 rounded-full bg-slate-2 p-4')}>
        <Icon icon={<ChatIcon stroke={tailwind.color('text-slate-9') ?? '#8B8D98'} />} size={28} />
      </View>

      {/* Title */}
      <Text style={style('text-lg font-semibold text-slate-12 mb-2 text-center')}>
        {hasActiveSession
          ? i18n.t('AI_ASSISTANT.CHAT.EMPTY_STATE.TITLE_WITH_SESSION')
          : i18n.t('AI_ASSISTANT.CHAT.EMPTY_STATE.TITLE_NO_SESSION')}
      </Text>

      {/* Description */}
      <Text style={style('text-sm text-slate-11 text-center max-w-[340px]')}>
        {hasActiveSession
          ? i18n.t('AI_ASSISTANT.CHAT.EMPTY_STATE.DESCRIPTION_WITH_SESSION')
          : i18n.t('AI_ASSISTANT.CHAT.EMPTY_STATE.DESCRIPTION_NO_SESSION')}
      </Text>

      {/* Suggested prompt chips */}
      {!hasActiveSession && onSendPrompt && (
        <View style={style('mt-6 gap-2 w-full max-w-[340px]')}>
          {SUGGESTED_PROMPT_KEYS.map(key => {
            const prompt = i18n.t(key);
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
      )}
    </View>
  );
};
