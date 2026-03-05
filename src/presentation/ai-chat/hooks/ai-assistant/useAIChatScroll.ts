import { useRef, useEffect, useCallback, useState } from 'react';
import type { NativeScrollEvent } from 'react-native';
import {
  calculateDistanceFromBottom,
  isNearBottom,
  NEAR_BOTTOM_THRESHOLD,
} from '@presentation/ai-chat/utils/ai-assistant';

export interface FlashListRef {
  scrollToEnd: (opts: { animated: boolean }) => void;
  scrollToIndex: (opts: {
    index: number;
    animated: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }) => void;
  scrollToOffset?: (opts: { offset: number; animated: boolean }) => void;
}

export interface UseAIChatScrollReturn {
  listRef: React.RefObject<FlashListRef | null>;
  handleScroll: (event: { nativeEvent: NativeScrollEvent }) => void;
  scrollToBottom: (animated?: boolean) => void;
  scrollToTop: (animated?: boolean) => void;
  shouldAutoScroll: () => boolean;
  isAtBottom: boolean;
  isAtTop: boolean;
}

/**
 * Safely attempt to scroll the FlashList.
 * Uses a single try/catch with silent fallback instead of nested retries.
 */
function safeScroll(
  listRef: React.RefObject<FlashListRef | null>,
  target: 'end' | { index: number; viewPosition?: number },
  animated: boolean,
): void {
  if (!listRef.current) return;
  try {
    if (target === 'end') {
      listRef.current.scrollToEnd({ animated });
    } else {
      listRef.current.scrollToIndex({
        index: target.index,
        animated,
        viewPosition: target.viewPosition,
      });
    }
  } catch {
    try {
      listRef.current.scrollToEnd({ animated });
    } catch {
      // Truly nothing to scroll to — silently ignore.
    }
  }
}

/**
 * Hook for managing auto-scroll behavior in AI chat
 */
export function useAIChatScroll(
  activeSessionId: string | null,
  isLoadingMessages: boolean,
  messagesLength: number,
  listDataLength: number,
): UseAIChatScrollReturn {
  const listRef = useRef<FlashListRef | null>(null);
  const shouldAutoScrollRef = useRef<boolean>(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollLengthRef = useRef<number>(0);
  const previousSessionIdRef = useRef<string | null>(activeSessionId || null);
  const hasScrolledForSessionRef = useRef<string | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const isNearBottomRef = useRef<boolean>(true);
  const isNearTopRef = useRef<boolean>(true);

  // Reactive state for UI scroll buttons
  // Debounced to avoid infinite re-render loops during streaming
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll when a new conversation is loaded
  useEffect(() => {
    const sessionChanged = previousSessionIdRef.current !== activeSessionId;

    // Update ref to track session changes
    if (sessionChanged) {
      previousSessionIdRef.current = activeSessionId || null;
      // Reset scroll length tracking when session changes
      lastScrollLengthRef.current = 0;
      // Mark that we haven't scrolled for this session yet
      hasScrolledForSessionRef.current = null;
    }

    // Auto-scroll when:
    // 1. Messages just finished loading (not loading and have messages)
    // 2. We haven't scrolled for this session yet OR session just changed
    // 3. List ref is available
    const messagesJustLoaded = !isLoadingMessages && messagesLength > 0;
    const hasListRef = listRef.current !== null;
    const needsScroll = hasScrolledForSessionRef.current !== activeSessionId || sessionChanged;
    const shouldScroll = messagesJustLoaded && needsScroll && hasListRef;

    if (shouldScroll) {
      // Enable auto-scroll for new conversation
      shouldAutoScrollRef.current = true;

      // Clear any pending scroll
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }

      // Wait for list to render, then scroll to bottom
      scrollTimeoutIdRef.current = setTimeout(() => {
        if (listRef.current && messagesLength > 0) {
          isProgrammaticScrollRef.current = true;
          safeScroll(listRef, 'end', true);
          lastScrollLengthRef.current = messagesLength;
          hasScrolledForSessionRef.current = activeSessionId || null;
        }
      }, 300);
    }

    return () => {
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, isLoadingMessages, messagesLength]);

  // Auto-scroll when new messages arrive (during streaming)
  useEffect(() => {
    // Only auto-scroll if message count actually changed (not on every token update)
    if (
      messagesLength !== lastScrollLengthRef.current &&
      messagesLength > 0 &&
      shouldAutoScrollRef.current &&
      listRef.current
    ) {
      // Clear any pending scroll
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }

      // Debounce scroll to prevent excessive calls during rapid streaming updates
      scrollTimeoutIdRef.current = setTimeout(() => {
        if (listRef.current && shouldAutoScrollRef.current && listDataLength > 0) {
          isProgrammaticScrollRef.current = true;
          safeScroll(listRef, { index: listDataLength - 1, viewPosition: 1 }, false);
          lastScrollLengthRef.current = messagesLength;
        }
      }, 32);
    }

    return () => {
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesLength, listDataLength]); // Only depend on length, not the array itself

  // Handle scroll events to detect user scrolling and track position
  const handleScroll = useCallback((event: { nativeEvent: NativeScrollEvent }) => {
    // Ignore programmatic scrolls (we initiated them, so don't update shouldAutoScrollRef)
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    const distanceFromBottom = calculateDistanceFromBottom(event);
    const { contentOffset } = event.nativeEvent;

    // User is near bottom (within threshold) - enable auto-scroll
    // User has scrolled up - disable auto-scroll
    const nearBottom = isNearBottom(distanceFromBottom);
    const nearTop = contentOffset.y <= NEAR_BOTTOM_THRESHOLD;

    shouldAutoScrollRef.current = nearBottom;

    // Update refs immediately (no re-render)
    isNearBottomRef.current = nearBottom;
    isNearTopRef.current = nearTop;

    // Debounce reactive state updates to avoid re-render loops during streaming
    if (scrollStateTimeoutRef.current) {
      clearTimeout(scrollStateTimeoutRef.current);
    }
    scrollStateTimeoutRef.current = setTimeout(() => {
      setIsAtBottom(prev => (prev !== nearBottom ? nearBottom : prev));
      setIsAtTop(prev => (prev !== nearTop ? nearTop : prev));
    }, 150);

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // If user is near bottom, keep auto-scroll enabled
    // If user scrolled up, keep it disabled (no timeout to re-enable)
    // This way, if user scrolls back to bottom, auto-scroll re-enables immediately
  }, []);

  // Scroll to bottom programmatically
  const scrollToBottom = useCallback(
    (animated = true) => {
      if (listRef.current && listDataLength > 0) {
        isProgrammaticScrollRef.current = true;
        safeScroll(listRef, { index: listDataLength - 1, viewPosition: 1 }, animated);
      }
    },
    [listDataLength],
  );

  // Scroll to top programmatically
  const scrollToTop = useCallback((animated = true) => {
    if (listRef.current) {
      isProgrammaticScrollRef.current = true;
      safeScroll(listRef, { index: 0 }, animated);
    }
  }, []);

  // Check if auto-scroll is enabled
  const shouldAutoScroll = useCallback(() => {
    return shouldAutoScrollRef.current;
  }, []);

  // Cleanup timeouts on unmount — read refs inside cleanup to get current values
  useEffect(() => {
    const scrollTimeout = scrollTimeoutRef.current;
    const scrollTimeoutId = scrollTimeoutIdRef.current;
    const scrollStateTimeout = scrollStateTimeoutRef.current;
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
      if (scrollStateTimeout) {
        clearTimeout(scrollStateTimeout);
      }
    };
  }, []);

  return {
    listRef,
    handleScroll,
    scrollToBottom,
    scrollToTop,
    shouldAutoScroll,
    isAtBottom,
    isAtTop,
  };
}
