import { useRef, useEffect, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { mapMessagesToUIMessages } from '@/store/ai-chat/aiChatMapper';
import type { AIChatMessage } from '@/store/ai-chat/aiChatTypes';
import { PART_TYPES } from '@/types/ai-chat/constants';

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

  // Track the last SDK messages before bridge replacement, so we can preserve
  // reasoning parts that the backend may not return.
  const lastSdkMessagesRef = useRef<UIMessage[]>([]);

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

      // Preserve reasoning parts from SDK messages that backend messages lack.
      // When streaming ends, the backend may not store reasoning parts, so we
      // merge them from the last known SDK state to prevent disappearing.
      const merged = mergeReasoningParts(converted, lastSdkMessagesRef.current);

      setMessagesRef.current(merged);
      loadedBridgeKeyRef.current = bridgeKey;
    }
  }, [activeSessionId, isLoadingMessages, backendMessages, chatStatus, isNewConversation]);

  const resetBridgeKey = useCallback(() => {
    loadedBridgeKeyRef.current = null;
  }, []);

  // Capture current SDK messages whenever status transitions from streaming to ready.
  // This gives us the last SDK state before the bridge overwrites.
  const prevStatusRef = useRef(chatStatus);
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && chatStatus === 'ready') {
      // Capture the current messages from SDK before the bridge replaces them.
      // We use setMessages with a callback that returns the same value but lets us capture.
      setMessagesRef.current((currentMessages: UIMessage[]) => {
        lastSdkMessagesRef.current = currentMessages;
        return currentMessages;
      });
    }
    prevStatusRef.current = chatStatus;
  }, [chatStatus]);

  return { resetBridgeKey };
}

/**
 * Merge reasoning parts from SDK messages into backend messages.
 * For each assistant message in the backend set, if it lacks reasoning parts
 * but a matching SDK message (by id) has them, prepend the reasoning parts.
 */
function mergeReasoningParts(backendMessages: UIMessage[], sdkMessages: UIMessage[]): UIMessage[] {
  if (sdkMessages.length === 0) return backendMessages;

  const sdkMap = new Map(sdkMessages.map(m => [m.id, m]));

  return backendMessages.map(msg => {
    if (msg.role !== 'assistant') return msg;

    const hasReasoning = msg.parts?.some(
      p => (p as { type: string }).type === PART_TYPES.REASONING,
    );
    if (hasReasoning) return msg;

    const sdkMsg = sdkMap.get(msg.id);
    if (!sdkMsg) return msg;

    const sdkReasoningParts = sdkMsg.parts?.filter(
      p => (p as { type: string }).type === PART_TYPES.REASONING,
    );
    if (!sdkReasoningParts || sdkReasoningParts.length === 0) return msg;

    return {
      ...msg,
      parts: [...sdkReasoningParts, ...(msg.parts || [])],
    };
  });
}
