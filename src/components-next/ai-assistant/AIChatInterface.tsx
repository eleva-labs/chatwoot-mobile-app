import React, { useCallback, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { UIMessage, UIMessagePart, UIDataTypes, UITools } from 'ai';
import { tailwind } from '@/theme';
import { useThemedStyles } from '@/hooks';
import { useAppSelector } from '@/hooks';
import { useAIStreaming } from '@/hooks/ai-assistant/useAIStreaming';
import { AIInputField } from './components/AIInputField';
import type { AIChatInterfaceProps } from './types';
import {
  selectIsLoadingSessions,
  selectIsLoadingMessages,
  selectActiveSessionId,
} from '@/store/ai-chat';
import { selectUser } from '@/store/auth/authSelectors';
import { useAIChatBot } from '@/hooks/ai-assistant/useAIChatBot';
import { useAIChatSessions } from '@/hooks/ai-assistant/useAIChatSessions';
import { useAIChatMessages } from '@/hooks/ai-assistant/useAIChatMessages';
import { useAIThoughts } from '@/hooks/ai-assistant/useAIThoughts';
import { useAIChatScroll } from '@/hooks/ai-assistant/useAIChatScroll';
import { AIChatHeader } from './components/AIChatHeader';
import { AIChatSessionPanel } from './components/AIChatSessionPanel';
import { AIChatMessagesList } from './components/AIChatMessagesList';

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

    // Thoughts management
    const {
      thoughtsText,
      isThoughtsVisible,
      streamingAnchorKey,
      handleThoughtEvent,
      handleReasoningStart,
      handleFinish,
      clearThoughts,
    } = useAIThoughts();

    // AI Streaming
    const {
      messages: streamingMessages,
      isLoading,
      error,
      sendMessage,
      cancel,
      setMessages,
    } = useAIStreaming({
      agentBotId: selectedBotId,
      chatSessionId: activeSessionId || undefined,
      onThoughtEvent: handleThoughtEvent, // Append to ephemeral thoughts
      onReasoningStart: handleReasoningStart, // Show THOUGHTS anchor
      onFinish: handleFinish, // Keep THOUGHTS visible, schedule cleanup
      // Note: Following Chatwoot's pattern, we use Rails proxy which handles backend communication
      // The Rails proxy endpoint is: POST /api/v1/accounts/:account_id/ai_chat/stream
    });

    // Sessions management (needs setMessages for new conversation)
    const {
      sessions,
      showSessions,
      setShowSessions,
      handleSelectSession,
      handleNewConversation: sessionsHandleNewConversation,
    } = useAIChatSessions(selectedBotId, accountId, agentBotId, setMessages);

    // Messages management
    const { allMessages, listData } = useAIChatMessages(
        activeSessionId,
      streamingMessages,
      isThoughtsVisible,
      streamingAnchorKey,
    );

    // Scroll management
    const { listRef, handleScroll, scrollToBottom, shouldAutoScroll } = useAIChatScroll(
      activeSessionId,
      isLoadingMessages,
      allMessages.length,
      listData.length,
    );

    // Override handleNewConversation to also clear thoughts
    const handleNewConversation = useCallback(() => {
      sessionsHandleNewConversation();
      clearThoughts();
    }, [sessionsHandleNewConversation, clearThoughts]);

    const themedTailwind = useThemedStyles();

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

        // Clear THOUGHTS from previous message
        clearThoughts();

        await sendMessage(text);

        // Auto-scroll to bottom after sending (debounced)
        setTimeout(() => {
          if (shouldAutoScroll() && listData.length > 0) {
            scrollToBottom(true);
          }
        }, 100);
      },
      [
        sendMessage,
        isLoading,
        selectedBotId,
        clearThoughts,
        scrollToBottom,
        shouldAutoScroll,
        listData.length,
      ],
    );

    // Extract tool calls from messages
    const toolCalls = useMemo(() => {
      return allMessages
        .flatMap((m: UIMessage) => m.parts || [])
        .filter((part: UIMessagePart<UIDataTypes, UITools>) => part.type?.startsWith('tool-'));
    }, [allMessages]);

    return (
      <KeyboardAvoidingView
        style={tailwind.style('flex-1')}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}>
        <View style={themedTailwind.style('flex-1 bg-white dark:bg-gray-900')}>
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
