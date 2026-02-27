/**
 * AIChatInterface Component
 *
 * Main AI chat interface component.
 * Uses the modern useAIChat hook with DefaultChatTransport.
 * Part rendering (reasoning, tools, text) is handled per-message by AIMessageBubble,
 * matching the Vue AiChatPanel architecture.
 *
 * Split into:
 * - AIChatMessagesView (inner, memo'd) — owns scroll logic + message list rendering
 * - AIChatInterface (container) — owns useAIChat, useAIChatSessions, Redux state
 */

import React, { useCallback, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { UIMessage } from 'ai';
import { tailwind } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import {
  useAIChat,
  useAIChatBot,
  useAIChatSessions,
  useAIChatScroll,
} from '@/presentation/hooks/ai-assistant';
import { validateAndNormalizeMessages } from '@/presentation/utils/ai-assistant';
import { AIInputField } from '@/presentation/components/ai-assistant/AIInputField';
import type { AIChatInterfaceProps } from './types';
import {
  selectIsLoadingSessions,
  selectActiveSessionId,
  setActiveSession,
} from '@/store/ai-chat';
import { selectUser } from '@/store/auth/authSelectors';
import { AIChatHeader } from '@/presentation/components/ai-assistant/AIChatHeader';
import { AIChatSessionPanel } from '@/presentation/components/ai-assistant/AIChatSessionPanel';
import { AIChatMessagesList } from '@/presentation/components/ai-assistant/AIChatMessagesList';
import { isTextPart, type MessagePart } from '@/types/ai-chat/parts';

// ============================================================================
// AIChatMessagesView — Inner component isolated from session management renders
// ============================================================================

/** Inner component for message display — isolated from session management renders */
const AIChatMessagesView = React.memo<{
  listData: UIMessage[];
  isLoading: boolean;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
  isLoadingMessages: boolean;
  activeSessionId: string | null;
  error: Error | null;
  messagesLength: number;
  selectedBot: { name?: string; avatar_url?: string } | undefined;
  userName: string | undefined;
  sendMessage: (text: string) => Promise<void>;
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
}>(
  ({
    listData,
    isLoading,
    status,
    isLoadingMessages,
    activeSessionId,
    error,
    messagesLength,
    selectedBot,
    userName,
    sendMessage,
    setMessages,
  }) => {
    // Scroll management lives here — only re-renders when messages/status change
    const {
      listRef,
      handleScroll,
      scrollToBottom,
      scrollToTop,
      isAtBottom,
      isAtTop,
    } = useAIChatScroll(activeSessionId, isLoadingMessages, messagesLength, listData.length);

    // Error/retry handlers
    const handleRetry = useCallback(async () => {
      const lastUserMsg = listData.filter(m => m.role === 'user').pop();
      if (lastUserMsg) {
        const textPart = lastUserMsg.parts?.find(p => isTextPart(p as MessagePart));
        if (textPart && 'text' in textPart) {
          await sendMessage(textPart.text as string);
        }
      }
    }, [listData, sendMessage]);

    const handleFreshStart = useCallback(async () => {
      setMessages([]);
    }, [setMessages]);

    return (
      <AIChatMessagesList
        listData={listData}
        isLoading={isLoading}
        status={status}
        isLoadingMessages={isLoadingMessages}
        activeSessionId={activeSessionId}
        error={error ?? null}
        listRef={listRef}
        onScroll={handleScroll as (event: { nativeEvent: unknown }) => void}
        botAvatarName={selectedBot?.name}
        botAvatarSrc={selectedBot?.avatar_url}
        userAvatarName={userName}
        isAtBottom={isAtBottom}
        isAtTop={isAtTop}
        onScrollToBottom={scrollToBottom}
        onScrollToTop={scrollToTop}
        onRetry={handleRetry}
        onFreshStart={handleFreshStart}
      />
    );
  },
);
AIChatMessagesView.displayName = 'AIChatMessagesView';

// ============================================================================
// AIChatInterface — Container component
// ============================================================================

export const AIChatInterface: React.FC<AIChatInterfaceProps> = React.memo(
  ({ agentBotId, onClose }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const accountId = user?.account_id;
    const isLoadingSessions = useAppSelector(selectIsLoadingSessions);
    const activeSessionId = useAppSelector(selectActiveSessionId);

    // Bot management
    const { selectedBotId, selectedBot } = useAIChatBot(agentBotId, accountId);

    // Callback when session ID is extracted from response (deferred to post-streaming by Fix #1)
    const onSessionIdExtracted = useCallback(
      (sessionId: string) => {
        dispatch(setActiveSession({ sessionId }));
      },
      [dispatch],
    );

    // AI Chat using modern DefaultChatTransport
    const {
      messages,
      isLoading,
      status,
      error,
      sendMessage,
      stop: cancel,
      setMessages,
      clearSession,
    } = useAIChat({
      agentBotId: selectedBotId,
      chatSessionId: activeSessionId || undefined,
      onSessionIdExtracted,
    });

    // Sessions management — pass chatStatus to guard bridge effect during streaming
    const {
      sessions,
      isLoadingMessages,
      showSessions,
      setShowSessions,
      handleSelectSession,
      handleNewConversation,
    } = useAIChatSessions(
      selectedBotId,
      accountId,
      agentBotId,
      setMessages,
      clearSession,
      cancel,
      status,
    );

    // Validate and normalize messages for safe FlashList rendering
    const listData = useMemo(() => {
      return validateAndNormalizeMessages(messages);
    }, [messages]);

    const { style, tokens } = useAIStyles();

    // Handle send message
    const handleSend = useCallback(
      async (text: string) => {
        if (!text.trim() || isLoading || isLoadingMessages) {
          return;
        }

        if (!selectedBotId) {
          console.error('[AIChatInterface] Cannot send message: No agent bot selected');
          return;
        }

        await sendMessage(text);
      },
      [sendMessage, isLoading, isLoadingMessages, selectedBotId],
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
            status={status}
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

          <AIChatMessagesView
            listData={listData}
            isLoading={isLoading}
            status={status}
            isLoadingMessages={isLoadingMessages}
            activeSessionId={activeSessionId}
            error={error ?? null}
            messagesLength={messages.length}
            selectedBot={selectedBot ?? undefined}
            userName={user?.name}
            sendMessage={sendMessage}
            setMessages={setMessages}
          />

          <AIInputField
            onSend={handleSend}
            isLoading={isLoading || isLoadingMessages}
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
