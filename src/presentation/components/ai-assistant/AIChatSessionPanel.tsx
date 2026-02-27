import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { AISessionList } from './AISessionList';
import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

export interface AIChatSessionPanelProps {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
  isVisible: boolean;
}

export const AIChatSessionPanel: React.FC<AIChatSessionPanelProps> = React.memo(
  ({ sessions, activeSessionId, onSelectSession, isLoading, isVisible }) => {
    const { style, tokens } = useAIStyles();
    const sessionTokens = tokens.session;

    if (!isVisible) {
      return null;
    }

    return (
      <View
        style={[
          style('border-b h-64 flex-shrink-0', sessionTokens.border, sessionTokens.background),
          Platform.OS === 'ios'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }
            : {
                elevation: 4,
              },
        ]}>
        <ScrollView
          style={style('flex-1')}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}>
          <AISessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            isLoading={isLoading}
          />
        </ScrollView>
      </View>
    );
  },
);

AIChatSessionPanel.displayName = 'AIChatSessionPanel';
