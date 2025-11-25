import { useRef, useEffect, useCallback } from 'react';
import type { NativeScrollEvent } from 'react-native';
import { calculateDistanceFromBottom, isNearBottom } from '@/utils/ai-assistant/aiChatScrollUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FlashListRef = any;

export interface UseAIChatScrollReturn {
  listRef: React.RefObject<FlashListRef>;
  handleScroll: (event: { nativeEvent: NativeScrollEvent }) => void;
  scrollToBottom: (animated?: boolean) => void;
  shouldAutoScroll: () => boolean;
}

/**
 * Hook for managing auto-scroll behavior in AI chat
 */
export function useAIChatScroll(
  activeSessionId: string | null,
  isLoadingMessages: boolean,
  allMessagesLength: number,
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

  // Auto-scroll when a new conversation is loaded
  useEffect(() => {
    // Check if session changed
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
    const messagesJustLoaded = !isLoadingMessages && allMessagesLength > 0;
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
        if (listRef.current && allMessagesLength > 0) {
          // Mark as programmatic scroll so handleScroll doesn't update shouldAutoScrollRef
          isProgrammaticScrollRef.current = true;
          try {
            // First try scrollToEnd - most reliable for FlashList
            listRef.current.scrollToEnd({ animated: true });
            lastScrollLengthRef.current = allMessagesLength;
            hasScrolledForSessionRef.current = activeSessionId || null;
          } catch (error) {
            // If scrollToEnd fails, try scrollToIndex with actual last index
            console.warn('[useAIChatScroll] scrollToEnd failed for new conversation:', error);
            try {
              // Get the actual last index - use allMessagesLength as proxy for listDataLength
              // listData is derived from allMessages, so length should be similar
              const lastIndex = allMessagesLength > 0 ? allMessagesLength - 1 : 0;
              listRef.current.scrollToIndex({ index: lastIndex, animated: true });
              lastScrollLengthRef.current = allMessagesLength;
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
  }, [activeSessionId, isLoadingMessages, allMessagesLength]);

  // Auto-scroll when new messages arrive (during streaming)
  useEffect(() => {
    // Only auto-scroll if message count actually changed (not on every token update)
    if (
      allMessagesLength !== lastScrollLengthRef.current &&
      allMessagesLength > 0 &&
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
            lastScrollLengthRef.current = allMessagesLength;
          } catch (error) {
            // If scrollToIndex fails (e.g., item not yet rendered), try scrollToEnd
            console.warn('[useAIChatScroll] scrollToIndex failed:', error);
            try {
              listRef.current.scrollToEnd({ animated: false });
              lastScrollLengthRef.current = allMessagesLength;
            } catch (scrollEndError) {
              console.warn('[useAIChatScroll] scrollToEnd also failed:', scrollEndError);
            }
          }
        }
      }, 100); // Debounce by 100ms to batch rapid updates
    }

    return () => {
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessagesLength, listDataLength]); // Only depend on length, not the array itself

  // Handle scroll events to detect user scrolling and track position
  const handleScroll = useCallback((event: { nativeEvent: NativeScrollEvent }) => {
    // Ignore programmatic scrolls (we initiated them, so don't update shouldAutoScrollRef)
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    const distanceFromBottom = calculateDistanceFromBottom(event);

    // User is near bottom (within threshold) - enable auto-scroll
    // User has scrolled up - disable auto-scroll
    if (isNearBottom(distanceFromBottom)) {
      shouldAutoScrollRef.current = true;
    } else {
      shouldAutoScrollRef.current = false;
    }

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

  // Check if auto-scroll is enabled
  const shouldAutoScroll = useCallback(() => {
    return shouldAutoScrollRef.current;
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
      }
    };
  }, []);

  return {
    listRef,
    handleScroll,
    scrollToBottom,
    shouldAutoScroll,
  };
}
