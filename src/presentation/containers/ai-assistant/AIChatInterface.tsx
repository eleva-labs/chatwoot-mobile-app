/**
 * AIChatInterface Component
 *
 * Main AI chat interface component.
 * Uses the modern useAIChat hook with DefaultChatTransport.
 * Reasoning/thoughts are extracted from message parts (domain pattern).
 */

import React, { useCallback, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { UIMessage } from 'ai';
import { tailwind } from '@/theme';
import { useAppSelector } from '@/hooks';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
// Use the modern useAIChat hook (replaces deprecated useAIStreaming)
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

// Import domain helpers for extracting reasoning from message parts
import {
  getReasoningParts,
  getToolParts,
  type MessagePart,
} from '@/domain/types/ai-assistant/parts';

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

    // AI Chat using modern DefaultChatTransport (replaces deprecated useAIStreaming)
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
      // Note: Reasoning is now extracted from message.parts, not via callbacks
      // The Rails proxy endpoint handles backend communication
    });

    // Sessions management (needs setMessages for new conversation)
    const { sessions, showSessions, setShowSessions, handleSelectSession, handleNewConversation } =
      useAIChatSessions(selectedBotId, accountId, agentBotId, setMessages);

    // Extract reasoning text from the last assistant message (replaces useAIThoughts)
    const { thoughtsText, isThoughtsVisible } = useMemo(() => {
      // Find the last assistant message
      const lastAssistantMessage = [...streamingMessages]
        .reverse()
        .find(m => m.role === 'assistant');

      if (!lastAssistantMessage?.parts) {
        return { thoughtsText: '', isThoughtsVisible: false };
      }

      // Extract reasoning parts using domain helper
      const reasoningParts = getReasoningParts(lastAssistantMessage.parts as MessagePart[]);
      const text = reasoningParts.map(p => p.reasoning || p.text || '').join('\n');

      return {
        thoughtsText: text,
        isThoughtsVisible: text.length > 0,
      };
    }, [streamingMessages]);

    // Messages management (simplified - no longer needs thoughts anchor)
    const { allMessages, listData } = useAIChatMessages(
      activeSessionId,
      streamingMessages,
      isThoughtsVisible,
      0, // streamingAnchorKey no longer needed
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

        // Reasoning is now automatically extracted from message parts
        // No need to clear thoughts manually

        await sendMessage(text);

        // Auto-scroll to bottom after sending (debounced)
        setTimeout(() => {
          if (shouldAutoScroll() && listData.length > 0) {
            scrollToBottom(true);
          }
        }, 100);
      },
      [sendMessage, isLoading, selectedBotId, scrollToBottom, shouldAutoScroll, listData.length],
    );

    // Extract tool calls from messages using domain helper
    const toolCalls = useMemo(() => {
      return allMessages.flatMap((m: UIMessage) => getToolParts(m.parts as MessagePart[]));
    }, [allMessages]);

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
            toolCalls={toolCalls}
            listRef={listRef}
            onScroll={handleScroll as (event: { nativeEvent: unknown }) => void}
            thoughtsText={thoughtsText}
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
