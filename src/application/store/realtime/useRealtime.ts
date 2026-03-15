import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppSelector, useAppDispatch } from '@application/store/hooks';
import { useStore } from 'react-redux';
import { selectRealtimeConfig } from './realtimeSelectors';
import { ActionCableService } from './realtimeService';
import { navigationRef } from '@infrastructure/utils/navigationUtils';
import type { RootState } from '@application/store';

export function useRealtime(): void {
  const dispatch = useAppDispatch();
  const { getState } = useStore<RootState>();
  const config = useAppSelector(selectRealtimeConfig);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const getActiveChatConversationId = useCallback((): number | null => {
    const route = navigationRef.current?.getCurrentRoute();
    if (route?.name !== 'ChatScreen') return null;
    return (route.params as { conversationId?: number })?.conversationId ?? null;
  }, []);

  // Connect / reconnect when credentials change
  useEffect(() => {
    if (!config) {
      ActionCableService.disconnect();
      return;
    }
    ActionCableService.init(config, dispatch, getState, getActiveChatConversationId);
    return () => {
      ActionCableService.disconnect();
    };
  }, [config, dispatch, getState, getActiveChatConversationId]);

  // Reconnect on foreground resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      const c = configRef.current;
      if (c && !ActionCableService.isConnected) {
        ActionCableService.init(c, dispatch, getState, getActiveChatConversationId);
      }
    });
    return () => subscription.remove();
  }, [dispatch, getState, getActiveChatConversationId]);
}
