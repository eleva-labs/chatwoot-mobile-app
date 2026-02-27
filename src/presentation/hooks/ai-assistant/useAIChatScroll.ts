import { useRef, useEffect, useCallback, useState } from 'react';
import type { NativeScrollEvent } from 'react-native';
import {
  calculateDistanceFromBottom,
  isNearBottom,
  NEAR_BOTTOM_THRESHOLD,
} from '@/presentation/utils/ai-assistant';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FlashListRef = any;

export interface UseAIChatScrollReturn {
  listRef: React.RefObject<FlashListRef>;
  handleScroll: (event: { nativeEvent: NativeScrollEvent }) => void;
  scrollToBottom: (animated?: boolean) => void;
  scrollToTop: (animated?: boolean) => void;
  shouldAutoScroll: () => boolean;
  isAtBottom: boolean;
  isAtTop: boolean;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null);
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
      // Use longer delay to ensure FlashList has rendered all items
      scrollTimeoutIdRef.current = setTimeout(() => {
        if (listRef.current && messagesLength > 0) {
          // Mark as programmatic scroll so handleScroll doesn't update shouldAutoScrollRef
          isProgrammaticScrollRef.current = true;
          try {
            // First try scrollToEnd - most reliable for FlashList
            listRef.current.scrollToEnd({ animated: true });
            lastScrollLengthRef.current = messagesLength;
            hasScrolledForSessionRef.current = activeSessionId || null;
          } catch (error) {
            // If scrollToEnd fails, try scrollToIndex with actual last index
            console.warn('[useAIChatScroll] scrollToEnd failed for new conversation:', error);
            try {
              // Get the actual last index - use messagesLength as proxy for listDataLength
              // listData is derived from allMessages, so length should be similar
              const lastIndex = messagesLength > 0 ? messagesLength - 1 : 0;
              listRef.current.scrollToIndex({ index: lastIndex, animated: true });
              lastScrollLengthRef.current = messagesLength;
              hasScrolledForSessionRef.current = activeSessionId || null;
            } catch (scrollEndError) {
              console.warn(
                '[useAIChatScroll] scrollToIndex also failed for new conversation:',
                scrollEndError,
              );
              // Last resort: try again after a longer delay
              setTimeout(() => {
                if (listRef.current) {
                  try {
                    listRef.current.scrollToEnd({ animated: true });
                    hasScrolledForSessionRef.current = activeSessionId || null;
                  } catch (retryError) {
                    console.warn('[useAIChatScroll] Retry scrollToEnd failed:', retryError);
                  }
                }
              }, 300);
            }
          }
        }
      }, 300); // Increased delay to ensure list is fully rendered
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
          // Mark as programmatic scroll so handleScroll doesn't update shouldAutoScrollRef
          isProgrammaticScrollRef.current = true;
          try {
            // Scroll to bottom (last index) for chronological order
            const lastIndex = listDataLength - 1;
            listRef.current.scrollToIndex({ index: lastIndex, animated: false });
            lastScrollLengthRef.current = messagesLength;
          } catch (error) {
            // If scrollToIndex fails (e.g., item not yet rendered), try scrollToEnd
            console.warn('[useAIChatScroll] scrollToIndex failed:', error);
            try {
              listRef.current.scrollToEnd({ animated: false });
              lastScrollLengthRef.current = messagesLength;
            } catch (scrollEndError) {
              console.warn('[useAIChatScroll] scrollToEnd also failed:', scrollEndError);
            }
          }
        }
      }, 32); // Debounce by ~2 frames for smoother streaming scroll
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
        try {
          const lastIndex = listDataLength - 1;
          listRef.current.scrollToIndex({ index: lastIndex, animated });
        } catch (error) {
          console.warn('[useAIChatScroll] scrollToIndex failed in scrollToBottom:', error);
          try {
            listRef.current.scrollToEnd({ animated });
          } catch (scrollEndError) {
            console.warn('[useAIChatScroll] scrollToEnd failed in scrollToBottom:', scrollEndError);
          }
        }
      }
    },
    [listDataLength],
  );

  // Scroll to top programmatically
  const scrollToTop = useCallback((animated = true) => {
    if (listRef.current) {
      isProgrammaticScrollRef.current = true;
      try {
        listRef.current.scrollToIndex({ index: 0, animated });
      } catch (error) {
        console.warn('[useAIChatScroll] scrollToTop failed:', error);
      }
    }
  }, []);

  // Check if auto-scroll is enabled
  const shouldAutoScroll = useCallback(() => {
    return shouldAutoScrollRef.current;
  }, []);

  // Cleanup timeouts on unmount — read refs inside cleanup to get current values
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }
      if (scrollStateTimeoutRef.current) {
        clearTimeout(scrollStateTimeoutRef.current);
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
