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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { UIMessage } from 'ai';
import { tailwind } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { chatwootChatConfig } from '@/ai/chatwootChatConfig';
import { createChatwootSessionsAdapter } from '@/ai/chatwootSessionsAdapter';
import {
  useAIChat,
  useAIChatBot,
  useAIChatSessions,
  useAIChatScroll,
} from '@/presentation/hooks/ai-assistant';
import { useMessageBridge } from '@/presentation/hooks/ai-assistant/useMessageBridge';
import { AIChatProvider } from '@/presentation/hooks/ai-assistant/useAIChatProvider';
import { validateAndNormalizeMessages } from '@/presentation/utils/ai-assistant';
import i18n from '@/i18n';
import { AIInputField } from '@/presentation/components/ai-assistant/AIInputField';
import type { AIChatInterfaceProps } from './types';
import {
  selectIsLoadingSessions,
  selectActiveSessionId,
  selectIsLoadingMessages,
  selectMessagesBySession,
  setActiveSession,
} from '@/store/ai-chat';
import type { AIChatMessage } from '@/store/ai-chat/aiChatTypes';
import { selectUser } from '@/store/auth/authSelectors';
import { AIChatHeader } from '@/presentation/components/ai-assistant/AIChatHeader';
import { AIChatSessionPanel } from '@/presentation/components/ai-assistant/AIChatSessionPanel';
import { AIChatMessagesList } from '@/presentation/components/ai-assistant/AIChatMessagesList';
import { isTextPart, type MessagePart } from '@/types/ai-chat/parts';

// Stable empty array reference to prevent unnecessary rerenders
const EMPTY_MESSAGES: AIChatMessage[] = [];

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
  onSendPrompt?: (text: string) => void;
  onDismiss?: () => void;
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
    onSendPrompt,
    onDismiss,
  }) => {
    // Scroll management lives here — only re-renders when messages/status change
    const { listRef, handleScroll, scrollToBottom, scrollToTop, isAtBottom, isAtTop } =
      useAIChatScroll(activeSessionId, isLoadingMessages, messagesLength, listData.length);

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
        onDismiss={onDismiss}
        onFreshStart={handleFreshStart}
        onSendPrompt={onSendPrompt}
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
    const isLoadingMessages = useAppSelector(selectIsLoadingMessages);

    // Backend messages for the active session (used by message bridge)
    const backendMessages = useAppSelector(state =>
      activeSessionId ? selectMessagesBySession(state, activeSessionId) : EMPTY_MESSAGES,
    );

    // Sessions adapter (stable, created once)
    const sessionsAdapter = useMemo(() => createChatwootSessionsAdapter(), []);

    // Bot management
    const { selectedBotId, selectedBot } = useAIChatBot(agentBotId, accountId);

    // Callback when session ID is extracted from response (deferred to post-streaming by Fix #1)
    const onSessionIdExtracted = useCallback(
      (sessionId: string) => {
        dispatch(setActiveSession({ sessionId }));
      },
      [dispatch],
    );

    // AI Chat using ChatConfig-based DefaultChatTransport
    const {
      messages,
      isLoading,
      status,
      error,
      sendMessage,
      stop: cancel,
      setMessages,
      clearSession,
    } = useAIChat(chatwootChatConfig, {
      agentBotId: selectedBotId,
      chatSessionId: activeSessionId || undefined,
      onSessionIdExtracted,
    });

    // Error dismissal — track the dismissed error message so it stays hidden until a new error occurs
    const [dismissedError, setDismissedError] = useState<string | null>(null);
    const visibleError = error && error.message !== dismissedError ? error : null;
    const handleDismiss = useCallback(() => {
      if (error) {
        setDismissedError(error.message);
      }
    }, [error]);

    // Bridge key reset ref — shared between sessions hook and message bridge.
    // We use a ref so both hooks can reference it without circular dependencies.
    const bridgeKeyResetRef = useRef<(() => void) | null>(null);
    const handleBridgeKeyReset = useCallback(() => {
      bridgeKeyResetRef.current?.();
    }, []);

    // Sessions management
    const {
      sessions,
      isLoadingMessages: isLoadingSessionMessages,
      showSessions,
      setShowSessions,
      handleSelectSession,
      handleNewConversation,
      isNewConversation,
    } = useAIChatSessions(sessionsAdapter, selectedBotId, {
      stop: cancel,
      clearSession,
      onBridgeKeyReset: handleBridgeKeyReset,
    });

    // Message bridge — loads backend messages into SDK when not streaming
    const { resetBridgeKey } = useMessageBridge({
      activeSessionId,
      isLoadingMessages,
      backendMessages,
      chatStatus: status,
      setMessages,
      isNewConversation,
    });

    // Wire the bridge key reset to the ref so sessions hook can call it
    useEffect(() => {
      bridgeKeyResetRef.current = resetBridgeKey;
    }, [resetBridgeKey]);

    // Validate and normalize messages for safe FlashList rendering
    const listData = useMemo(() => {
      return validateAndNormalizeMessages(messages);
    }, [messages]);

    // Chatwoot i18n adapter — wraps the app's i18n system for the AI chat context
    const chatwootI18n = useMemo(() => ({
      t: (key: string, params?: Record<string, unknown>) => i18n.t(key, params),
      get locale() { return i18n.locale; },
      dir: 'ltr' as const,
    }), []);

    const { style, tokens } = useAIStyles();

    // Session panel callbacks (stable refs for memo'd children)
    const handleToggleSessions = useCallback(() => {
      setShowSessions(!showSessions);
    }, [setShowSessions, showSessions]);

    const handleCloseSessions = useCallback(() => {
      setShowSessions(false);
    }, [setShowSessions]);

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
      <AIChatProvider i18n={chatwootI18n}>
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
              onToggleSessions={handleToggleSessions}
              onNewConversation={handleNewConversation}
              onClose={onClose}
            />

            <AIChatMessagesView
              listData={listData}
              isLoading={isLoading}
              status={status}
              isLoadingMessages={isLoadingMessages}
              activeSessionId={activeSessionId}
              error={visibleError ?? null}
              messagesLength={messages.length}
              selectedBot={selectedBot ?? undefined}
              userName={user?.name}
              sendMessage={sendMessage}
              setMessages={setMessages}
              onSendPrompt={handleSend}
              onDismiss={handleDismiss}
            />

            <AIInputField
              onSend={handleSend}
              isLoading={isLoading || isLoadingMessages}
              onCancel={isLoading ? cancel : undefined}
            />

            {/* Session panel LAST so BottomSheet overlays on top */}
            <AIChatSessionPanel
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              isLoading={isLoadingSessions}
              isVisible={showSessions}
              onClose={handleCloseSessions}
            />
          </View>
        </KeyboardAvoidingView>
      </AIChatProvider>
    );
  },
  // Memo comparison function
  (prevProps, nextProps) => {
    return prevProps.agentBotId === nextProps.agentBotId && prevProps.onClose === nextProps.onClose;
  },
);

AIChatInterface.displayName = 'AIChatInterface';
