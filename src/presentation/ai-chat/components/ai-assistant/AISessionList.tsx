import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AIChatSession } from '@application/store/ai-chat/aiChatTypes';
import { AISessionItem } from './AISessionItem';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';

interface AISessionListProps {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export const AISessionList: React.FC<AISessionListProps> = React.memo(
  ({ sessions, activeSessionId, onSelectSession, isLoading }) => {
    const { style, tokens } = useAIStyles();
    const { t } = useAIi18n();
    const sessionTokens = tokens.session;

    if (isLoading) {
      return (
        <View style={style('p-4 items-center justify-center')}>
          <Text style={style(sessionTokens.subtitle)}>
            {t('AI_ASSISTANT.CHAT.SESSIONS.LOADING')}
          </Text>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={style('p-4 items-center justify-center')}>
          <Text style={style(sessionTokens.subtitle)}>{t('AI_ASSISTANT.CHAT.SESSIONS.EMPTY')}</Text>
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
