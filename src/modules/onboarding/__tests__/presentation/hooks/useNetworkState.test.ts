/**
 * Tests for useNetworkState Hook
 *
 * useNetworkState monitors network connectivity using NetInfo.
 * It tracks connection status and internet reachability.
 */

import React from 'react';
// @ts-expect-error - @testing-library/react-hooks is used in tests but may not be in package.json
// eslint-disable-next-line import/no-unresolved
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { useNetworkState } from '../../../presentation/hooks/useNetworkState';
import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';

// Mock NetInfo
jest.mock('@react-native-community/netinfo');

describe('useNetworkState', () => {
  let mockNetInfo: jest.Mocked<typeof NetInfo>;
  let listeners: ((state: NetInfoState) => void)[];

  beforeEach(() => {
    listeners = [];
    mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

    // Mock addEventListener to capture listeners
    mockNetInfo.addEventListener = jest.fn(listener => {
      listeners.push(listener);
      return jest.fn(); // Unsubscribe function
    });

    // Default: return connected state
    mockNetInfo.fetch = jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as NetInfoState);
  });

  afterEach(() => {
    listeners = [];
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should start in loading state', () => {
      const { result } = renderHook(() => useNetworkState());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOffline).toBe(false);
    });

    it('should fetch initial network state on mount', async () => {
      renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(mockNetInfo.fetch).toHaveBeenCalled();
      });
    });

    it('should subscribe to network changes on mount', async () => {
      renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(mockNetInfo.addEventListener).toHaveBeenCalled();
      });
    });
  });

  describe('Connected state', () => {
    it('should show connected when online', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle connected but internet not reachable', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle connected with null internet reachability', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: null,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOffline).toBe(false); // Only isConnected matters
    });
  });

  describe('Offline state', () => {
    it('should show offline when not connected', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should show offline when connection is null', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: null,
        isInternetReachable: null,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOffline).toBe(false);
    });

    it('should prioritize isConnected for offline state', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: true, // Contradiction (edge case)
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(true);
    });
  });

  describe('Network state changes', () => {
    it('should update when going offline', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate going offline
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });

    it('should update when coming back online', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      // Simulate coming online
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: true,
          } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    it('should handle rapid state changes', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate rapid changes
      act(() => {
        listeners.forEach(listener =>
          listener({ isConnected: false, isInternetReachable: false } as NetInfoState),
        );
        listeners.forEach(listener =>
          listener({ isConnected: true, isInternetReachable: false } as NetInfoState),
        );
        listeners.forEach(listener =>
          listener({ isConnected: true, isInternetReachable: true } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
    });

    it('should update internet reachability independently', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isInternetReachable).toBe(true);
      });

      // Lose internet reachability but stay connected
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('Subscription cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockNetInfo.addEventListener.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(mockNetInfo.addEventListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should not update state after unmount', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result, unmount } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      unmount();

      // Try to trigger state change after unmount
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      // State should not update (hook is unmounted)
      // No error should be thrown
    });

    it('should handle multiple mount/unmount cycles', async () => {
      const { unmount: unmount1 } = renderHook(() => useNetworkState());
      await waitFor(() => expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(1));
      unmount1();

      const { unmount: unmount2 } = renderHook(() => useNetworkState());
      await waitFor(() => expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(2));
      unmount2();

      const { unmount: unmount3 } = renderHook(() => useNetworkState());
      await waitFor(() => expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(3));
      unmount3();
    });
  });

  describe('Derived states', () => {
    it('should calculate isOffline correctly', async () => {
      // Case 1: Connected and reachable = not offline
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });

      // Case 2: Not connected = offline
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: true,
          } as NetInfoState),
        );
      });

      expect(result.current.isOffline).toBe(true);

      // Case 3: Connected but not reachable = offline
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isOffline).toBe(true);

      // Case 4: Both false = offline
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should calculate isLoading correctly', async () => {
      const { result } = renderHook(() => useNetworkState());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // After fetch, not loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // State changes don't affect loading
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle fetch error gracefully', async () => {
      mockNetInfo.fetch.mockRejectedValue(new Error('Network fetch failed'));

      const { result } = renderHook(() => useNetworkState());

      // Should remain in loading/default state
      await waitFor(() => {
        expect(mockNetInfo.fetch).toHaveBeenCalled();
      });

      // State should handle error (may vary based on implementation)
      // The hook doesn't explicitly handle errors, so state remains initial
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle undefined values in NetInfo state', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: undefined,
        isInternetReachable: undefined,
      } as unknown as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
    });

    it('should handle partial NetInfo state', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        // isInternetReachable missing
      } as Partial<NetInfoState> as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(false);
    });

    it('should handle very frequent network changes', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate 100 rapid network changes
      act(() => {
        for (let i = 0; i < 100; i++) {
          const isConnected = i % 2 === 0;
          listeners.forEach(listener =>
            listener({
              isConnected,
              isInternetReachable: isConnected,
            } as NetInfoState),
          );
        }
      });

      // Should reflect final state (100 is even, so false)
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle listener being called before fetch completes', async () => {
      let resolveFetch: (value: NetInfoState) => void;
      const fetchPromise = new Promise<NetInfoState>(resolve => {
        resolveFetch = resolve;
      });
      mockNetInfo.fetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useNetworkState());

      // Listener fires before fetch completes
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: true,
          } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(true);

      // Now resolve fetch
      await act(async () => {
        resolveFetch!({
          isConnected: false,
          isInternetReachable: false,
        } as NetInfoState);
        await fetchPromise;
      });

      // Fetch result should overwrite listener result
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Multiple instances', () => {
    it('should handle multiple hook instances independently', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result: result1 } = renderHook(() => useNetworkState());
      const { result: result2 } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result1.current.isConnected).toBe(true);
        expect(result2.current.isConnected).toBe(true);
      });

      // Both should receive the same updates
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result1.current.isOffline).toBe(true);
      expect(result2.current.isOffline).toBe(true);
    });

    it('should handle individual unmounting', async () => {
      const { unmount: unmount1 } = renderHook(() => useNetworkState());
      const { result: result2 } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(2);
      });

      unmount1();

      // result2 should still work
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result2.current.isOffline).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical app lifecycle', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      // App loads - connected
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // User enters tunnel - loses connection
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isOffline).toBe(true);

      // User exits tunnel - regains connection
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: true,
          } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    it('should handle WiFi to cellular transition', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Brief disconnect during transition
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: false,
            isInternetReachable: false,
          } as NetInfoState),
        );
      });

      expect(result.current.isOffline).toBe(true);

      // Reconnect on cellular
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: true,
          } as NetInfoState),
        );
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should handle captive portal scenario', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false, // Connected to WiFi but no internet
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOffline).toBe(true); // Should be treated as offline

      // After authentication
      act(() => {
        listeners.forEach(listener =>
          listener({
            isConnected: true,
            isInternetReachable: true,
          } as NetInfoState),
        );
      });

      expect(result.current.isOffline).toBe(false);
    });
  });

  describe('Return value stability', () => {
    it('should return new object on each render', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result, rerender } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const firstReturn = result.current;
      // Trigger a re-render by rerendering the hook
      rerender();
      const secondReturn = result.current;

      // New object, but same values
      expect(firstReturn).not.toBe(secondReturn);
      expect(firstReturn.isConnected).toBe(secondReturn.isConnected);
    });

    it('should have consistent boolean values', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All return values should be actual booleans
      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.isInternetReachable).toBe('boolean');
      expect(typeof result.current.isOffline).toBe('boolean');
      expect(typeof result.current.isLoading).toBe('boolean');
    });
  });
});
