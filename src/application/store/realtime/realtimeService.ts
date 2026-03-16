import { ActionCableConnector } from './actionCableConnector';
import { ActionCableReconnectService } from './realtimeReconnectService';
import type { RealtimeConfig } from './realtimeTypes';
import type { AppDispatch, RootState } from '@application/store';

export class ActionCableService {
  private static connector: ActionCableConnector | null = null;

  static init(
    config: RealtimeConfig,
    dispatch: AppDispatch,
    getState: () => RootState,
    getActiveChatConversationId: () => number | null,
  ): void {
    ActionCableService.connector?.disconnect();

    const reconnectService = new ActionCableReconnectService(
      dispatch,
      getState,
      getActiveChatConversationId,
    );

    ActionCableService.connector = new ActionCableConnector(
      config,
      dispatch,
      getState,
      new Set<number>(),
    );
    ActionCableService.connector.setReconnectService(reconnectService);
  }

  static disconnect(): void {
    ActionCableService.connector?.disconnect();
    ActionCableService.connector = null;
  }

  static get isConnected(): boolean {
    return ActionCableService.connector?.isConnected ?? false;
  }
}
