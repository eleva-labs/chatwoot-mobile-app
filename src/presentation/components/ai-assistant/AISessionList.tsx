import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';
import { AISessionItem } from './AISessionItem';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

interface AISessionListProps {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export const AISessionList: React.FC<AISessionListProps> = React.memo(
  ({ sessions, activeSessionId, onSelectSession, isLoading }) => {
    const { style, tokens } = useAIStyles();
    const sessionTokens = tokens.session;

    if (isLoading) {
      return (
        <View style={style('p-4 items-center justify-center')}>
          <Text style={style(sessionTokens.subtitle)}>Loading sessions...</Text>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={style('p-4 items-center justify-center')}>
          <Text style={style(sessionTokens.subtitle)}>No previous conversations</Text>
        </View>
      );
    }

    return (
      <Animated.View style={style(sessionTokens.background)}>
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
