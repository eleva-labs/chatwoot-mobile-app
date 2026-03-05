import { store } from '@application/store';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { selectFilters } from '@application/store/conversation/conversationFilterSlice';
import { navigationRef } from './navigationUtils';

export class MobileReconnectService {
  private disconnectTime: Date | null = null;

  onDisconnect(): void {
    this.disconnectTime = new Date();
  }

  async onReconnect(): Promise<void> {
    // Guard: only run if we had a prior disconnect
    if (this.disconnectTime === null) {
      return;
    }

    const state = store.getState();
    const filters = selectFilters(state);

    // Refresh the conversation list using current filter state
    await store.dispatch(
      conversationActions.fetchConversations({
        page: 1,
        status: filters.status as Parameters<
          typeof conversationActions.fetchConversations
        >[0]['status'],
        assigneeType: filters.assignee_type as Parameters<
          typeof conversationActions.fetchConversations
        >[0]['assigneeType'],
        sortBy: filters.sort_by as Parameters<
          typeof conversationActions.fetchConversations
        >[0]['sortBy'],
        inboxId: parseInt(filters.inbox_id, 10),
      }),
    );

    // If ChatScreen is currently active, also refetch that conversation
    const currentRoute = navigationRef.current?.getCurrentRoute();
    if (currentRoute?.name === 'ChatScreen') {
      const params = currentRoute.params as { conversationId?: number } | undefined;
      const conversationId = params?.conversationId;
      if (conversationId != null) {
        await store.dispatch(conversationActions.fetchConversation(conversationId));
      }
    }

    this.disconnectTime = null;
  }
}
