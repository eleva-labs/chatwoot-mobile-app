import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemedStyles } from '@/hooks';
import { Icon } from '@/components-next/common';
import { CloseIcon } from '@/svg-icons';
import type { AIChatBot } from '@/services/AIChatService';

export interface AIChatHeaderProps {
  selectedBot: AIChatBot | null;
  sessionsCount: number;
  activeSessionId: string | null;
  onToggleSessions: () => void;
  onNewConversation: () => void;
  onClose: () => void;
}

export const AIChatHeader: React.FC<AIChatHeaderProps> = React.memo(
  ({
    selectedBot,
    sessionsCount,
    activeSessionId,
    onToggleSessions,
    onNewConversation,
    onClose,
  }) => {
    const themedTailwind = useThemedStyles();

    return (
      <View
        style={themedTailwind.style(
          'px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-row items-center justify-between',
        )}
        accessible
        accessibilityRole="header">
        <View style={themedTailwind.style('flex-row items-center flex-1')}>
          <Text
            style={themedTailwind.style(
              'text-lg font-inter-semibold-20 text-gray-900 dark:text-white',
            )}
            accessible
            accessibilityRole="text"
            accessibilityLabel={selectedBot?.name || 'AI Assistant'}>
            {selectedBot?.name || 'AI Assistant'}
          </Text>
          {sessionsCount > 0 && (
            <Pressable
              onPress={onToggleSessions}
              style={({ pressed }) =>
                themedTailwind.style('ml-3 p-1 rounded', pressed && 'opacity-70')
              }
              accessible
              accessibilityRole="button"
              accessibilityLabel="Toggle sessions list">
              <Text
                style={themedTailwind.style(
                  'text-sm text-blue-600 dark:text-blue-400 font-inter-420-20',
                )}>
                Sessions ({sessionsCount})
              </Text>
            </Pressable>
          )}
        </View>
        <View style={themedTailwind.style('flex-row items-center gap-2')}>
          {activeSessionId && (
            <Pressable
              onPress={onNewConversation}
              style={({ pressed }) =>
                themedTailwind.style('p-2 rounded-full', pressed && 'opacity-70')
              }
              accessible
              accessibilityRole="button"
              accessibilityLabel="New conversation">
              <Text
                style={themedTailwind.style(
                  'text-sm text-blue-600 dark:text-blue-400 font-inter-420-20',
                )}>
                New
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) =>
              themedTailwind.style('p-2 rounded-full', pressed && 'opacity-70')
            }
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
