import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { AISessionList } from './AISessionList';
import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import i18n from '@/i18n';

export interface AIChatSessionPanelProps {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
  isVisible: boolean;
  onClose: () => void;
}

export const AIChatSessionPanel: React.FC<AIChatSessionPanelProps> = React.memo(
  ({ sessions, activeSessionId, onSelectSession, isLoading, isVisible, onClose }) => {
    const { style, tokens } = useAIStyles();
    const sessionTokens = tokens.session;
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['40%', '75%'], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.3} />
      ),
      [],
    );

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose();
        }
      },
      [onClose],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={style(sessionTokens.background)}
        handleIndicatorStyle={style('bg-slate-6 w-10')}>
        <View style={style('px-4 pb-2 flex-row items-center justify-between')}>
          <Text style={style('text-base font-inter-580-24', sessionTokens.title)}>
            {i18n.t('AI_ASSISTANT.CHAT.SESSIONS_PANEL.TITLE')}
          </Text>
          <Text style={style('text-sm', sessionTokens.subtitle)}>
            {i18n.t(
              sessions.length === 1
                ? 'AI_ASSISTANT.CHAT.SESSIONS_PANEL.COUNT_ONE'
                : 'AI_ASSISTANT.CHAT.SESSIONS_PANEL.COUNT_OTHER',
              { count: sessions.length },
            )}
          </Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={style('pb-8')}>
          <AISessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={sessionId => {
              onSelectSession(sessionId);
              onClose();
            }}
            isLoading={isLoading}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

AIChatSessionPanel.displayName = 'AIChatSessionPanel';
