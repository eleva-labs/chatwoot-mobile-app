import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '@/components-next/common';
import { CloseIcon } from '@/svg-icons';
import type { AIChatBot } from '@/store/ai-chat/aiChatTypes';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

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
          <Text
            style={style('text-lg font-inter-semibold-20', headerTokens.title)}
            accessible
            accessibilityRole="text"
            accessibilityLabel={selectedBot?.name || 'AI Assistant'}>
            {selectedBot?.name || 'AI Assistant'}
          </Text>
          {status && (
            <View style={style('flex-row items-center gap-1.5 ml-2')}>
              <View
                style={style(
                  'w-2 h-2 rounded-full',
                  status === 'ready' && 'bg-teal-9',
                  status === 'submitted' && 'bg-amber-9',
                  status === 'streaming' && 'bg-amber-11',
                  status === 'error' && 'bg-ruby-9',
                )}
              />
              <Text style={style('text-xs', headerTokens.subtitle)}>
                {status === 'ready'
                  ? 'Ready'
                  : status === 'submitted'
                    ? 'Thinking...'
                    : status === 'streaming'
                      ? 'Streaming'
                      : 'Error'}
              </Text>
            </View>
          )}
          {sessionsCount > 0 && (
            <Pressable
              onPress={onToggleSessions}
              style={({ pressed }) => style('ml-3 p-1 rounded', pressed && 'opacity-70')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Toggle sessions list">
              <Text style={style('text-sm font-inter-420-20', headerTokens.link)}>
                Sessions ({sessionsCount})
              </Text>
            </Pressable>
          )}
        </View>
        <View style={style('flex-row items-center gap-2')}>
          {activeSessionId && (
            <Pressable
              onPress={onNewConversation}
              style={({ pressed }) => style('p-2 rounded-full', pressed && 'opacity-70')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="New conversation">
              <Text style={style('text-sm font-inter-420-20', headerTokens.link)}>New</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => style('p-2 rounded-full', pressed && 'opacity-70')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Close AI Assistant"
            accessibilityHint="Closes the AI assistant chat interface">
            <Icon icon={<CloseIcon />} size={20} />
          </Pressable>
        </View>
      </View>
    );
  },
);

AIChatHeader.displayName = 'AIChatHeader';
