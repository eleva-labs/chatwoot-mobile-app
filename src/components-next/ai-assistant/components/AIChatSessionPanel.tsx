import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useThemedStyles } from '@/hooks';
import { AISessionList } from './AISessionList';
import type { AIChatSession } from '@/domain/ai/types';

export interface AIChatSessionPanelProps {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
  isVisible: boolean;
}

export const AIChatSessionPanel: React.FC<AIChatSessionPanelProps> = React.memo(
  ({ sessions, activeSessionId, onSelectSession, isLoading, isVisible }) => {
    const themedTailwind = useThemedStyles();

    if (!isVisible) {
      return null;
    }

    return (
      <View
        style={[
          themedTailwind.style(
            'border-b border-gray-200 dark:border-gray-700 h-64 flex-shrink-0 bg-white dark:bg-gray-900',
          ),
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
        ]}
      >
        <ScrollView
          style={themedTailwind.style('flex-1')}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
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
