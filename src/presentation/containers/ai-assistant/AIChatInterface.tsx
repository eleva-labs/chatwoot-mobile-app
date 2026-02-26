/**
 * AIChatInterface Component
 *
 * Main AI chat interface component.
 * Uses the modern useAIChat hook with DefaultChatTransport.
 * Part rendering (reasoning, tools, text) is handled per-message by AIMessageBubble,
 * matching the Vue AiChatPanel architecture.
 */

import React, { useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { tailwind } from '@/theme';
import { useAppSelector } from '@/hooks';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import {
  useAIChat,
  useAIChatBot,
  useAIChatSessions,
  useAIChatMessages,
  useAIChatScroll,
} from '@/presentation/hooks/ai-assistant';
import { AIInputField } from '@/presentation/components/ai-assistant/AIInputField';
import type { AIChatInterfaceProps } from './types';
import {
  selectIsLoadingSessions,
  selectIsLoadingMessages,
  selectActiveSessionId,
} from '@/infrastructure/state/ai-assistant';
import { selectUser } from '@/store/auth/authSelectors';
import { AIChatHeader } from '@/presentation/components/ai-assistant/AIChatHeader';
import { AIChatSessionPanel } from '@/presentation/components/ai-assistant/AIChatSessionPanel';
import { AIChatMessagesList } from '@/presentation/components/ai-assistant/AIChatMessagesList';

export const AIChatInterface: React.FC<AIChatInterfaceProps> = React.memo(
  ({ agentBotId, onClose }) => {
    const insets = useSafeAreaInsets();
    const user = useAppSelector(selectUser);
    const accountId = user?.account_id;
    const isLoadingSessions = useAppSelector(selectIsLoadingSessions);
    const isLoadingMessages = useAppSelector(selectIsLoadingMessages);
    const activeSessionId = useAppSelector(selectActiveSessionId);

    // Bot management
    const { selectedBotId, selectedBot } = useAIChatBot(agentBotId, accountId);

    // AI Chat using modern DefaultChatTransport
    const {
      messages: streamingMessages,
      isLoading,
      error,
      sendMessage,
      stop: cancel,
      setMessages,
    } = useAIChat({
      agentBotId: selectedBotId,
      chatSessionId: activeSessionId || undefined,
    });

    // Sessions management
    const { sessions, showSessions, setShowSessions, handleSelectSession, handleNewConversation } =
      useAIChatSessions(selectedBotId, accountId, agentBotId, setMessages);

    // Messages management — no thoughts anchor needed since parts render per-message
    const { allMessages, listData } = useAIChatMessages(
      activeSessionId,
      streamingMessages,
      false, // isThoughtsVisible — no longer injecting separate thoughts anchor
      0, // streamingAnchorKey — no longer needed
    );

    // Scroll management
    const { listRef, handleScroll, scrollToBottom, shouldAutoScroll } = useAIChatScroll(
      activeSessionId,
      isLoadingMessages,
      allMessages.length,
      listData.length,
    );

    const { style, tokens } = useAIStyles();

    // Handle send message
    const handleSend = useCallback(
      async (text: string) => {
        if (!text.trim() || isLoading) {
          return;
        }

        if (!selectedBotId) {
          console.error('[AIChatInterface] Cannot send message: No agent bot selected');
          return;
        }

        await sendMessage(text);

        // Auto-scroll to bottom after sending
        setTimeout(() => {
          if (shouldAutoScroll() && listData.length > 0) {
            scrollToBottom(true);
          }
        }, 100);
      },
      [sendMessage, isLoading, selectedBotId, scrollToBottom, shouldAutoScroll, listData.length],
    );

    return (
      <KeyboardAvoidingView
        style={tailwind.style('flex-1')}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}>
        <View style={style('flex-1', tokens.session.background)}>
          <AIChatHeader
            selectedBot={selectedBot}
            sessionsCount={sessions.length}
            activeSessionId={activeSessionId}
            onToggleSessions={() => setShowSessions(!showSessions)}
            onNewConversation={handleNewConversation}
            onClose={onClose}
          />

          <AIChatSessionPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            isLoading={isLoadingSessions}
            isVisible={showSessions}
          />

          <AIChatMessagesList
            listData={listData}
            isLoading={isLoading}
            isLoadingMessages={isLoadingMessages}
            activeSessionId={activeSessionId}
            error={error || null}
            listRef={listRef}
            onScroll={handleScroll as (event: { nativeEvent: unknown }) => void}
          />

          <AIInputField
            onSend={handleSend}
            isLoading={isLoading}
            onCancel={isLoading ? cancel : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    );
  },
  // Memo comparison function
  (prevProps, nextProps) => {
    return prevProps.agentBotId === nextProps.agentBotId && prevProps.onClose === nextProps.onClose;
  },
);

AIChatInterface.displayName = 'AIChatInterface';
