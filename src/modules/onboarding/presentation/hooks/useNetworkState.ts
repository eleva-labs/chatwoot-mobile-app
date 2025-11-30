import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';

/**
 * Hook for network state management
 *
 * Monitors network connectivity and provides network state.
 */
export function useNetworkState() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? null);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? null);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected: isConnected === true,
    isInternetReachable: isInternetReachable === true,
    isOffline: isConnected === false || isInternetReachable === false,
    isLoading: isConnected === null,
  };
}
