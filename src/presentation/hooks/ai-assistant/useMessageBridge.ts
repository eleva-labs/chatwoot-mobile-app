import { useRef, useEffect, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { mapMessagesToUIMessages } from '@/store/ai-chat/aiChatMapper';
import type { AIChatMessage } from '@/store/ai-chat/aiChatTypes';

export interface UseMessageBridgeOptions {
  activeSessionId: string | null;
  isLoadingMessages: boolean;
  backendMessages: AIChatMessage[];
  chatStatus: 'ready' | 'submitted' | 'streaming' | 'error';
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
  isNewConversation: boolean;
}

/**
 * STREAMING SAFETY INVARIANTS
 *
 * This hook maintains 2 of the 5 streaming invariants:
 *
 * INV-2: Bridge Effect Streaming Guard
 *   The bridge effect checks chatStatus !== 'streaming' && chatStatus !== 'submitted'
 *   before calling setMessages(). This prevents overwriting live streaming content.
 *
 * INV-5: loadedBridgeKeyRef Fingerprint Dedup
 *   A string fingerprint (sessionId:count:firstId:lastId) prevents the bridge
 *   from re-firing after setMessages() triggers an SDK re-render.
 */
export function useMessageBridge(options: UseMessageBridgeOptions): {
  resetBridgeKey: () => void;
} {
  const {
    activeSessionId,
    isLoadingMessages,
    backendMessages,
    chatStatus,
    setMessages,
    isNewConversation,
  } = options;

  // Stable ref for setMessages to prevent cascade re-renders during streaming
  const setMessagesRef = useRef(setMessages);
  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  // Bridge key fingerprint — INV-5
  const loadedBridgeKeyRef = useRef<string | null>(null);

  // Reactive bridge effect — INV-2 guard
  useEffect(() => {
    if (
      activeSessionId &&
      !isLoadingMessages &&
      backendMessages.length > 0 &&
      setMessagesRef.current &&
      !isNewConversation &&
      chatStatus !== 'streaming' &&
      chatStatus !== 'submitted'
    ) {
      const firstId = backendMessages[0]?.id ?? '';
      const lastId = backendMessages[backendMessages.length - 1]?.id ?? '';
      const bridgeKey = `${activeSessionId}:${backendMessages.length}:${firstId}:${lastId}`;

      if (loadedBridgeKeyRef.current === bridgeKey) return;

      const converted = mapMessagesToUIMessages(backendMessages);
      setMessagesRef.current(converted);
      loadedBridgeKeyRef.current = bridgeKey;
    }
  }, [activeSessionId, isLoadingMessages, backendMessages, chatStatus, isNewConversation]);

  const resetBridgeKey = useCallback(() => {
    loadedBridgeKeyRef.current = null;
  }, []);

  return { resetBridgeKey };
}
