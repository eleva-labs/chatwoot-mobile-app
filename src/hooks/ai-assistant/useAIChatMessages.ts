import { useMemo } from 'react';
import type { UIMessage } from 'ai';
import { useAppSelector } from '@/hooks';
import { selectMessagesBySession } from '@/store/ai-chat';
import { convertBackendMessagesToUIMessages } from '@/utils/ai-assistant/aiChatUtils';
import type { AIChatMessage } from '@/services/AIChatService';
import { logger } from '@/utils/logger';
import { prepareListData } from '@/utils/ai-assistant/aiChatMessageUtils';

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

  // Merge backend messages with streaming messages and sort
  const allMessages = useMemo(() => {
    // Simple merge: rely on backend + SDK ordering; no manual sequencing/timestamps
    // - Backend messages are historical (persisted)
    // - Streaming messages include the current cycle (tokens only)
    // - THOUGHTS are rendered in UI (not injected as messages)
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
        // user before assistant on tie
        if (a.m.role === 'user' && b.m.role !== 'user') return -1;
        if (a.m.role !== 'user' && b.m.role === 'user') return 1;
        return (a.m.id || '').localeCompare(b.m.id || '');
      }
      // Fallback to original insertion order
      return a.idx - b.idx;
    });
    const sorted = withIndex.map(x => x.m);

    logger.log('[useAIChatMessages] Merged messages (Phase 4)', {
      convertedCount: convertedMessages.length,
      streamingCount: streamingMessages.length,
      total: sorted.length,
    });

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

