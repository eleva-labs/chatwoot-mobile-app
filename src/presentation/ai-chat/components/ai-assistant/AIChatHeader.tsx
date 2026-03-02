import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Plus, History, Bot } from 'lucide-react-native';
import { CloseIcon } from '@/svg-icons/common/CloseIcon';
import { Avatar } from '@infrastructure/ui/common/avatar/Avatar';
import type { AIChatBot } from '@application/store/ai-chat/aiChatTypes';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useResolveColor } from '@presentation/ai-chat/hooks/ai-assistant/useAITheme';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';

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
            {selectedBot?.avatar_url ? (
              <Avatar
                name={selectedBot?.name || t('AI_ASSISTANT.CHAT.TITLE')}
                src={{ uri: selectedBot.avatar_url }}
                size="lg"
              />
            ) : (
              <View style={style('w-7 h-7 rounded-full bg-slate-3 items-center justify-center')}>
                <Bot size={16} color={resolveColor('text-slate-11', '#60646C')} strokeWidth={2} />
              </View>
            )}
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
        </View>
        <View style={style('flex-row items-center gap-1')}>
          {activeSessionId && (
            <Pressable
              onPress={onNewConversation}
              style={({ pressed }) => style('p-1.5 rounded-md', pressed && 'bg-slate-3')}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.NEW_CONVERSATION')}>
              <Plus size={20} color={resolveColor('text-slate-10', '#80838D')} strokeWidth={2} />
            </Pressable>
          )}
          <Pressable
            onPress={onToggleSessions}
            style={({ pressed }) => style('p-1.5 rounded-md relative', pressed && 'bg-slate-3')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.SESSIONS_COUNT', {
              count: sessionsCount,
            })}>
            <History size={20} color={resolveColor('text-slate-10', '#80838D')} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => style('p-1.5 rounded-md', pressed && 'opacity-70')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.CLOSE')}
            accessibilityHint={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.CLOSE_HINT')}>
            <CloseIcon size={20} color={resolveColor('text-slate-10', '#80838D')} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    );
  },
);

AIChatHeader.displayName = 'AIChatHeader';
