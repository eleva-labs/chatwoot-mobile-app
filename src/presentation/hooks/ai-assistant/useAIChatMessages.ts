import { useMemo, useRef } from 'react';
import type { UIMessage } from 'ai';
import { useAppSelector } from '@/hooks';
import { selectMessagesBySession } from '@/infrastructure/state/ai-assistant';
import {
  convertBackendMessagesToUIMessages,
  prepareListData,
} from '@/presentation/utils/ai-assistant';
import type { AIChatMessage } from '@/infrastructure/dto/ai-assistant';
import { logger } from '@/utils/logger';

// Stable empty array reference to prevent unnecessary rerenders
const EMPTY_MESSAGES: AIChatMessage[] = [];

export interface UseAIChatMessagesReturn {
  allMessages: UIMessage[];
  listData: UIMessage[];
  convertedMessages: UIMessage[];
}

/**
 * Hook for managing AI chat messages (merging backend and streaming messages)
 */
export function useAIChatMessages(
  activeSessionId: string | null,
  streamingMessages: UIMessage[],
  isThoughtsVisible: boolean,
  streamingAnchorKey: number,
): UseAIChatMessagesReturn {
  // Get messages from Redux for active session
  const backendMessages = useAppSelector(state =>
    activeSessionId ? selectMessagesBySession(state, activeSessionId) : EMPTY_MESSAGES,
  );

  // Convert backend messages to UIMessage format
  const convertedMessages = useMemo(() => {
    if (backendMessages.length > 0) {
      return convertBackendMessagesToUIMessages(backendMessages);
    }
    return [];
  }, [backendMessages]);

  // Stable fingerprint to avoid recalculating when streaming messages haven't meaningfully changed
  // The SDK returns a new array reference on every render during streaming, even for the same content
  const prevFingerprintRef = useRef<string>('');
  const prevAllMessagesRef = useRef<UIMessage[]>([]);

  // Merge backend messages with streaming messages and sort
  const allMessages = useMemo(() => {
    // Build a lightweight fingerprint to detect actual content changes
    // Uses message count + last message id + last message parts length
    const lastStreaming = streamingMessages[streamingMessages.length - 1];
    const fingerprint = `${convertedMessages.length}:${streamingMessages.length}:${lastStreaming?.id || ''}:${lastStreaming?.parts?.length || 0}`;

    // Return previous result if content hasn't meaningfully changed
    if (fingerprint === prevFingerprintRef.current && prevAllMessagesRef.current.length > 0) {
      return prevAllMessagesRef.current;
    }
    prevFingerprintRef.current = fingerprint;

    // Simple merge: rely on backend + SDK ordering; no manual sequencing/timestamps
    const merged = [...convertedMessages, ...streamingMessages];
    // Sort by createdAt if available (oldest first). If missing, keep insertion order.
    const withIndex = merged.map((m, idx) => ({ m, idx }));
    const getCreatedAtMs = (msg: UIMessage): number | undefined => {
      const maybe = (msg as unknown as { createdAt?: Date }).createdAt;
      return maybe instanceof Date ? maybe.getTime() : undefined;
    };
    withIndex.sort((a, b) => {
      const at = getCreatedAtMs(a.m);
      const bt = getCreatedAtMs(b.m);
      if (typeof at === 'number' && typeof bt === 'number') {
        if (at !== bt) return at - bt;
        if (a.m.role === 'user' && b.m.role !== 'user') return -1;
        if (a.m.role !== 'user' && b.m.role === 'user') return 1;
        return (a.m.id || '').localeCompare(b.m.id || '');
      }
      return a.idx - b.idx;
    });
    const sorted = withIndex.map(x => x.m);

    logger.log('[useAIChatMessages] Merged messages (Phase 4)', {
      convertedCount: convertedMessages.length,
      streamingCount: streamingMessages.length,
      total: sorted.length,
    });

    prevAllMessagesRef.current = sorted;
    return sorted;
  }, [convertedMessages, streamingMessages]);

  // Prepare list data for FlashList (validate and inject THOUGHTS anchor)
  const listData = useMemo(() => {
    return prepareListData(allMessages, isThoughtsVisible, streamingAnchorKey);
  }, [allMessages, isThoughtsVisible, streamingAnchorKey]);

  return {
    allMessages,
    listData,
    convertedMessages,
  };
}
