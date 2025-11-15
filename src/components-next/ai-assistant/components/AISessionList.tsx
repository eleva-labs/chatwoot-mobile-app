import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemedStyles } from '@/hooks';
import type { AIChatSession } from '@/services/AIChatService';
import { AISessionItem } from './AISessionItem';

interface AISessionListProps {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export const AISessionList: React.FC<AISessionListProps> = React.memo(
  ({ sessions, activeSessionId, onSelectSession, isLoading }) => {
    const themedTailwind = useThemedStyles();

    if (isLoading) {
      return (
        <View style={themedTailwind.style('p-4 items-center justify-center')}>
          <Text style={themedTailwind.style('text-gray-500 dark:text-gray-400')}>
            Loading sessions...
          </Text>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={themedTailwind.style('p-4 items-center justify-center')}>
          <Text style={themedTailwind.style('text-gray-500 dark:text-gray-400')}>
            No previous conversations
          </Text>
        </View>
      );
    }

    return (
      <Animated.View style={themedTailwind.style('bg-white dark:bg-gray-900')}>
        {sessions.map((session, index) => (
          <AISessionItem
            key={session.chat_session_id}
            session={session}
            isActive={session.chat_session_id === activeSessionId}
            isLastItem={index === sessions.length - 1}
            onPress={() => onSelectSession(session.chat_session_id)}
          />
        ))}
      </Animated.View>
    );
  },
);

AISessionList.displayName = 'AISessionList';
