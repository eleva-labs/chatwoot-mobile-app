/**
 * Tests for useAIChatScroll hook
 *
 * Safety net before AI Generative UI Framework Phase 1.
 * Tests auto-scroll, scroll position tracking, and debounced state updates.
 *
 * IMPORTANT: Uses jest.useFakeTimers() because the hook has multiple setTimeout calls.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import type { NativeScrollEvent } from 'react-native';

import { useAIChatScroll } from '../useAIChatScroll';
import type { FlashListRef } from '../useAIChatScroll';

// ARCH-8: Configurable jest.fn() stubs for scroll utils (avoid re-implementing math in mocks)
const mockCalculateDistanceFromBottom = jest.fn().mockReturnValue(50);
const mockIsNearBottom = jest.fn().mockReturnValue(true);

jest.mock('@presentation/ai-chat/utils/ai-assistant', () => ({
  calculateDistanceFromBottom: (...args: unknown[]) => mockCalculateDistanceFromBottom(...args),
  isNearBottom: (...args: unknown[]) => mockIsNearBottom(...args),
  NEAR_BOTTOM_THRESHOLD: 100,
}));

// ─── Factories ────────────────────────────────────────────────────

function makeScrollEvent(opts: {
  contentOffsetY?: number;
  contentHeight?: number;
  viewportHeight?: number;
}): { nativeEvent: NativeScrollEvent } {
  const { contentOffsetY = 0, contentHeight = 1000, viewportHeight = 400 } = opts;

  return {
    nativeEvent: {
      contentOffset: { x: 0, y: contentOffsetY },
      contentSize: { height: contentHeight, width: 375 },
      layoutMeasurement: { height: viewportHeight, width: 375 },
      contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
      velocity: { x: 0, y: 0 },
      zoomScale: 1,
      targetContentOffset: { x: 0, y: contentOffsetY },
    } as NativeScrollEvent,
  };
}

function makeListRef(): FlashListRef & {
  scrollToEnd: jest.MockedFunction<FlashListRef['scrollToEnd']>;
  scrollToIndex: jest.MockedFunction<FlashListRef['scrollToIndex']>;
} {
  return {
    scrollToEnd: jest.fn(),
    scrollToIndex: jest.fn(),
    scrollToOffset: jest.fn(),
  };
}

function injectListRef(
  result: { current: ReturnType<typeof useAIChatScroll> },
  listRef: FlashListRef,
) {
  (result.current.listRef as React.MutableRefObject<FlashListRef | null>).current = listRef;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('useAIChatScroll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Reset scroll utils to defaults
    mockCalculateDistanceFromBottom.mockReturnValue(50);
    mockIsNearBottom.mockReturnValue(true);
  });

  // ARCH-7: Use clearAllTimers (not runAllTimers) to avoid executing pending scroll callbacks
  // after the test completes (which could interfere with subsequent tests).
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ─── Initial state ────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with isAtBottom=true', () => {
      const { result } = renderHook(() => useAIChatScroll(null, false, 0, 0));
      expect(result.current.isAtBottom).toBe(true);
    });

    it('starts with isAtTop=true', () => {
      const { result } = renderHook(() => useAIChatScroll(null, false, 0, 0));
      expect(result.current.isAtTop).toBe(true);
    });

    it('shouldAutoScroll returns true initially', () => {
      const { result } = renderHook(() => useAIChatScroll(null, false, 0, 0));
      expect(result.current.shouldAutoScroll()).toBe(true);
    });

    it('listRef starts as null', () => {
      const { result } = renderHook(() => useAIChatScroll(null, false, 0, 0));
      expect(result.current.listRef.current).toBeNull();
    });
  });

  // ─── Session-load scroll ──────────────────────────────────────────

  describe('session-load scroll', () => {
    // FG-7: When a session finishes loading (isLoadingMessages: true→false with messages),
    // the session-load effect fires and calls scrollToEnd (safeScroll with target='end').
    it('calls scrollToEnd when session loads (isLoadingMessages transitions true→false)', () => {
      const mockRef = makeListRef();

      // Start with messages loading
      const { result, rerender } = renderHook(
        ({ isLoadingMessages }: { isLoadingMessages: boolean }) =>
          useAIChatScroll('session-1', isLoadingMessages, 5, 5),
        { initialProps: { isLoadingMessages: true } },
      );

      injectListRef(result, mockRef);

      // Messages finish loading — the session-load effect fires
      rerender({ isLoadingMessages: false });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      // The session-load effect calls safeScroll(listRef, 'end', true) → scrollToEnd
      expect(mockRef.scrollToEnd).toHaveBeenCalled();
    });

    it('scrolls to end when session changes (only session-load effect fires)', () => {
      const mockRef = makeListRef();

      // Render with existing messages and a settled session — simulate session already loaded
      const { result, rerender } = renderHook(
        ({ sessionId }: { sessionId: string }) => useAIChatScroll(sessionId, false, 5, 5),
        { initialProps: { sessionId: 'session-1' } },
      );

      injectListRef(result, mockRef);

      // Advance the initial session-1 scroll timer to settle state
      act(() => {
        jest.advanceTimersByTime(400);
      });

      mockRef.scrollToEnd.mockClear();
      mockRef.scrollToIndex.mockClear();

      // Switch to session-2 with the same messagesLength=5.
      // Only the session-load effect re-fires (its dep `activeSessionId` changed).
      // The streaming effect does NOT re-fire because its deps [messagesLength, listDataLength]
      // are both still 5 — no change. So only the session-load 300ms timer fires → scrollToEnd.
      rerender({ sessionId: 'session-2' });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      // The session-load effect is the only one that fires on session change when messagesLength
      // stays the same. It calls safeScroll(listRef, 'end', true) → scrollToEnd.
      expect(mockRef.scrollToEnd).toHaveBeenCalled();
    });

    it('does NOT call scrollToEnd when isLoadingMessages=true', () => {
      const mockRef = makeListRef();

      const { result } = renderHook(() => useAIChatScroll('session-1', true, 5, 5));
      injectListRef(result, mockRef);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockRef.scrollToEnd).not.toHaveBeenCalled();
    });

    it('does NOT call scrollToEnd when messagesLength=0', () => {
      const mockRef = makeListRef();

      const { result } = renderHook(() => useAIChatScroll('session-1', false, 0, 0));
      injectListRef(result, mockRef);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockRef.scrollToEnd).not.toHaveBeenCalled();
    });

    it('scrolls again when session changes', () => {
      const mockRef = makeListRef();

      const { result, rerender } = renderHook(
        ({ sessionId }: { sessionId: string | null }) => useAIChatScroll(sessionId, false, 3, 3),
        { initialProps: { sessionId: 'session-1' as string | null } },
      );

      injectListRef(result, mockRef);

      // Trigger the session-load effect for session-1
      act(() => {
        jest.advanceTimersByTime(300);
      });

      const firstCallCount = mockRef.scrollToEnd.mock.calls.length;

      // Change session — resets hasScrolledForSessionRef so it will scroll again
      rerender({ sessionId: 'session-2' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockRef.scrollToEnd.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });

  // ─── Streaming scroll ─────────────────────────────────────────────

  describe('streaming scroll', () => {
    it('calls scrollToIndex when messages grow and auto-scroll is enabled', () => {
      const mockRef = makeListRef();

      // Start with no messages, inject ref, then add messages
      const { result, rerender } = renderHook(
        ({ messagesLength, listDataLength }: { messagesLength: number; listDataLength: number }) =>
          useAIChatScroll('session-1', false, messagesLength, listDataLength),
        { initialProps: { messagesLength: 0, listDataLength: 0 } },
      );

      injectListRef(result, mockRef);

      // Initial session-load scroll (empty, no scroll yet)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Add first message
      rerender({ messagesLength: 1, listDataLength: 1 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      mockRef.scrollToEnd.mockClear();
      mockRef.scrollToIndex.mockClear();

      // Add a second message (streaming)
      rerender({ messagesLength: 2, listDataLength: 2 });

      act(() => {
        jest.advanceTimersByTime(32);
      });

      expect(mockRef.scrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({ index: 1, animated: false }),
      );
    });

    it('auto-scroll is disabled after user scrolls far from bottom', () => {
      // Configure mocks so user scroll reports "not near bottom"
      mockCalculateDistanceFromBottom.mockReturnValue(1600);
      mockIsNearBottom.mockReturnValue(false);

      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));

      // Initially auto-scroll is enabled
      expect(result.current.shouldAutoScroll()).toBe(true);

      // First scroll — if programmatic scroll fired, this is ignored (isProgrammatic=true)
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
      });

      // Second scroll — regardless of programmatic state, send another far-from-bottom scroll
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
      });

      // At least one of the two scroll events processed and disabled auto-scroll
      expect(result.current.shouldAutoScroll()).toBe(false);
    });

    // MC-11: scrollToBottom does NOT disable shouldAutoScroll (programmatic scroll is ignored)
    it('programmatic scrollToBottom does NOT disable shouldAutoScroll', () => {
      const mockRef = makeListRef();

      // Configure mock so handleScroll would normally disable auto-scroll
      mockCalculateDistanceFromBottom.mockReturnValue(1600);
      mockIsNearBottom.mockReturnValue(false);

      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      injectListRef(result, mockRef);

      // Programmatic scroll
      act(() => {
        result.current.scrollToBottom();
      });

      // Then immediately a scroll event fires (as if from the programmatic scroll)
      // This event should be ignored because isProgrammaticScrollRef=true
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
      });

      // shouldAutoScroll should still be true (programmatic event was ignored)
      expect(result.current.shouldAutoScroll()).toBe(true);
    });
  });

  // ─── handleScroll ─────────────────────────────────────────────────

  describe('handleScroll', () => {
    it('disables auto-scroll when user scrolls far from bottom', () => {
      mockCalculateDistanceFromBottom.mockReturnValue(1100);
      mockIsNearBottom.mockReturnValue(false);

      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));

      // First user scroll (programmatic ref is false from init, so this will process)
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 1500, viewportHeight: 400 }),
        );
      });

      // Second scroll to ensure programmatic flag from any prior scroll is cleared
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 1500, viewportHeight: 400 }),
        );
      });

      expect(result.current.shouldAutoScroll()).toBe(false);
    });

    it('re-enables auto-scroll when user scrolls near bottom', () => {
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));

      // Scroll up to disable
      mockCalculateDistanceFromBottom.mockReturnValue(1100);
      mockIsNearBottom.mockReturnValue(false);
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 1500, viewportHeight: 400 }),
        );
      });
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 1500, viewportHeight: 400 }),
        );
      });

      // Scroll near bottom to re-enable
      mockCalculateDistanceFromBottom.mockReturnValue(0);
      mockIsNearBottom.mockReturnValue(true);
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 600, contentHeight: 1000, viewportHeight: 400 }),
        );
      });

      expect(result.current.shouldAutoScroll()).toBe(true);
    });

    it('updates isAtBottom to false after scroll-up debounce', () => {
      mockCalculateDistanceFromBottom.mockReturnValue(1600);
      mockIsNearBottom.mockReturnValue(false);

      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));

      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
        jest.advanceTimersByTime(150);
      });

      expect(result.current.isAtBottom).toBe(false);
    });

    it('updates isAtBottom to true when near bottom after debounce', () => {
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));

      // Scroll away first
      mockCalculateDistanceFromBottom.mockReturnValue(1600);
      mockIsNearBottom.mockReturnValue(false);
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
        jest.advanceTimersByTime(150);
      });

      // Scroll back to bottom
      mockCalculateDistanceFromBottom.mockReturnValue(0);
      mockIsNearBottom.mockReturnValue(true);
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 600, contentHeight: 1000, viewportHeight: 400 }),
        );
        jest.advanceTimersByTime(150);
      });

      expect(result.current.isAtBottom).toBe(true);
    });

    // MC-12: isAtTop state
    it('updates isAtTop to true when at the very top after debounce', () => {
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));

      // Fire a scroll event at contentOffsetY=0 (top of the list)
      // The hook checks: nearTop = contentOffset.y <= NEAR_BOTTOM_THRESHOLD (100)
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
        jest.advanceTimersByTime(150);
      });

      // isAtTop should be true since contentOffset.y=0 <= NEAR_BOTTOM_THRESHOLD=100
      expect(result.current.isAtTop).toBe(true);
    });
  });

  // ─── scrollToBottom ───────────────────────────────────────────────

  describe('scrollToBottom', () => {
    it('calls scrollToIndex on the list ref when listDataLength > 0', () => {
      const mockRef = makeListRef();
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      injectListRef(result, mockRef);

      act(() => {
        result.current.scrollToBottom();
      });

      expect(mockRef.scrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({ index: 4, viewPosition: 1, animated: true }),
      );
    });

    it('does NOT call scrollToIndex when listRef is null', () => {
      const mockRef = makeListRef();
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      // Do NOT inject ref — leave it null

      act(() => {
        result.current.scrollToBottom();
      });

      expect(mockRef.scrollToIndex).not.toHaveBeenCalled();
    });

    it('supports animated=false option', () => {
      const mockRef = makeListRef();
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      injectListRef(result, mockRef);

      act(() => {
        result.current.scrollToBottom(false);
      });

      expect(mockRef.scrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({ animated: false }),
      );
    });
  });

  // ─── scrollToTop ──────────────────────────────────────────────────

  describe('scrollToTop', () => {
    it('calls scrollToIndex with index=0', () => {
      const mockRef = makeListRef();
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      injectListRef(result, mockRef);

      act(() => {
        result.current.scrollToTop();
      });

      expect(mockRef.scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it('supports animated=false option', () => {
      const mockRef = makeListRef();
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      injectListRef(result, mockRef);

      act(() => {
        result.current.scrollToTop(false);
      });

      expect(mockRef.scrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({ animated: false }),
      );
    });

    it('does NOT call scrollToIndex when listRef is null', () => {
      const mockRef = makeListRef();
      const { result } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      // Do NOT inject ref

      act(() => {
        result.current.scrollToTop();
      });

      expect(mockRef.scrollToIndex).not.toHaveBeenCalled();
    });
  });

  // ─── Cleanup on unmount ───────────────────────────────────────────

  describe('cleanup', () => {
    it('does not throw when unmounted with pending timers', () => {
      // This test verifies that the cleanup function in the hook runs
      // without errors when the component unmounts.
      const { result, unmount } = renderHook(() => useAIChatScroll('session-1', false, 5, 5));
      const mockRef = makeListRef();
      injectListRef(result, mockRef);

      // Create some pending timers
      act(() => {
        result.current.handleScroll(
          makeScrollEvent({ contentOffsetY: 0, contentHeight: 2000, viewportHeight: 400 }),
        );
      });

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('stops auto-scroll after unmount (timers are cancelled)', () => {
      const mockRef = makeListRef();

      const { result, rerender, unmount } = renderHook(
        ({ messagesLength, listDataLength }: { messagesLength: number; listDataLength: number }) =>
          useAIChatScroll('session-1', false, messagesLength, listDataLength),
        { initialProps: { messagesLength: 0, listDataLength: 0 } },
      );

      injectListRef(result, mockRef);
      rerender({ messagesLength: 3, listDataLength: 3 });

      // Clear any calls already made so we only measure post-unmount calls
      mockRef.scrollToIndex.mockClear();

      // Unmount before timers fire
      unmount();

      // Advance timers — should not cause any scroll calls (streaming effect uses scrollToIndex)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // The streaming effect (which runs on messagesLength change) calls scrollToIndex, not scrollToEnd.
      // After unmount the cleanup cancels the pending setTimeout, so scrollToIndex must not be called.
      expect(mockRef.scrollToIndex).not.toHaveBeenCalled();
    });
  });
});
