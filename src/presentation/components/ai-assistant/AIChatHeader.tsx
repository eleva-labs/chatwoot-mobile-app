import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { Avatar } from '@/components-next/common/avatar/Avatar';
import type { AIChatBot } from '@/store/ai-chat/aiChatTypes';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { useResolveColor } from '@/presentation/hooks/ai-assistant/useAITheme';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';

export interface AIChatHeaderProps {
  selectedBot: AIChatBot | null;
  sessionsCount: number;
  activeSessionId: string | null;
  status?: 'ready' | 'submitted' | 'streaming' | 'error';
  onToggleSessions: () => void;
  onNewConversation: () => void;
  onClose: () => void;
}

export const AIChatHeader: React.FC<AIChatHeaderProps> = React.memo(
  ({
    selectedBot,
    sessionsCount,
    activeSessionId,
    status,
    onToggleSessions,
    onNewConversation,
    onClose,
  }) => {
    const { style, tokens } = useAIStyles();
    const { t } = useAIi18n();
    const resolveColor = useResolveColor();
    const headerTokens = tokens.header;

    return (
      <View
        style={style(
          'px-4 py-3 border-b flex-row items-center justify-between',
          headerTokens.background,
          headerTokens.border,
        )}
        accessible
        accessibilityRole="header">
        <View style={style('flex-row items-center flex-1')}>
          <View style={style('flex-row items-center gap-2')}>
            <Avatar
              name={selectedBot?.name || t('AI_ASSISTANT.CHAT.TITLE')}
              src={selectedBot?.avatar_url ? { uri: selectedBot.avatar_url } : undefined}
              size="lg"
            />
            <Text
              style={style('text-lg font-inter-semibold-20', headerTokens.title)}
              accessible
              accessibilityRole="text"
              accessibilityLabel={selectedBot?.name || t('AI_ASSISTANT.CHAT.TITLE')}>
              {selectedBot?.name || t('AI_ASSISTANT.CHAT.TITLE')}
            </Text>
          </View>
          {status && status !== 'ready' && (
            <View style={style('flex-row items-center gap-1.5 ml-2')}>
              <View
                style={style(
                  'w-2 h-2 rounded-full',
                  status === 'submitted' && 'bg-amber-9',
                  status === 'streaming' && 'bg-teal-9',
                  status === 'error' && 'bg-ruby-9',
                )}
              />
              {status !== 'streaming' && (
                <Text style={style('text-xs', headerTokens.subtitle)}>
                  {status === 'submitted'
                    ? t('AI_ASSISTANT.CHAT.STATUS.THINKING')
                    : t('AI_ASSISTANT.CHAT.STATUS.ISSUE')}
                </Text>
              )}
            </View>
          )}
          {sessionsCount > 0 && (
            <Pressable
              onPress={onToggleSessions}
              style={({ pressed }) =>
                style(
                  'ml-3 p-2 rounded-full flex-row items-center gap-1.5',
                  pressed && 'bg-slate-3',
                )
              }
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.SESSIONS_COUNT', {
                count: sessionsCount,
              })}>
              <Text style={style('text-sm font-inter-420-20', headerTokens.link)}>
                {t('AI_ASSISTANT.CHAT.HEADER.SESSIONS')}
              </Text>
              <View style={style('bg-slate-5 rounded-full px-1.5 min-w-[20px] items-center')}>
                <Text style={style('text-xs font-inter-580-24', headerTokens.subtitle)}>
                  {sessionsCount}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
        <View style={style('flex-row items-center gap-2')}>
          {activeSessionId && (
            <Pressable
              onPress={onNewConversation}
              style={({ pressed }) => style('p-2 rounded-full', pressed && 'bg-slate-3')}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.NEW_CONVERSATION')}>
              <Plus
                size={20}
                color={resolveColor('text-slate-11', '#60646C')}
                strokeWidth={2}
              />
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => style('p-2 rounded-full', pressed && 'opacity-70')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.CLOSE')}
            accessibilityHint={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.CLOSE_HINT')}>
            <X
              size={20}
              color={resolveColor('text-slate-10', '#80838D')}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>
    );
  },
);

AIChatHeader.displayName = 'AIChatHeader';
