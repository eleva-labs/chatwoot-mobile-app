import { conversationActions } from '@application/store/conversation/conversationActions';
import { selectFilters } from '@application/store/conversation/conversationFilterSlice';
import type { AppDispatch, RootState } from '@application/store';
import type { ConversationStatus, AssigneeTypes, SortTypes } from '@domain/types/common';

const CATCH_UP_THRESHOLD_MS = 30_000;
const MAX_JITTER_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ActionCableReconnectService {
  private disconnectTime: number | null = null;

  constructor(
    private readonly dispatch: AppDispatch,
    private readonly getState: () => RootState,
    private readonly getActiveChatConversationId: () => number | null,
  ) {}

  onDisconnect(): void {
    this.disconnectTime = Date.now();
  }

  private buildFetchParams(page: number, filters: ReturnType<typeof selectFilters>) {
    return {
      page,
      status: filters.status as ConversationStatus,
      assigneeType: filters.assignee_type as AssigneeTypes,
      sortBy: filters.sort_by as SortTypes,
      inboxId: parseInt(filters.inbox_id, 10) || 0,
    };
  }

  async onReconnect(): Promise<void> {
    const dt = this.disconnectTime;
    if (dt === null) return;
    this.disconnectTime = null;

    const offlineDurationMs = Date.now() - dt;

    // Jitter to spread reconnect storms across clients
    await sleep(Math.random() * MAX_JITTER_MS);

    const filters = selectFilters(this.getState());

    // Page 1 catch-up (always)
    try {
      await this.dispatch(
        conversationActions.fetchConversations(this.buildFetchParams(1, filters)),
      );
    } catch {
      // Network error or rejected thunk — continue with remaining operations
    }

    // Page 2 catch-up (long offline only)
    if (offlineDurationMs > CATCH_UP_THRESHOLD_MS) {
      try {
        await this.dispatch(
          conversationActions.fetchConversations(this.buildFetchParams(2, filters)),
        );
      } catch {
        // Continue
      }
    }

    // Active conversation catch-up
    const conversationId = this.getActiveChatConversationId();
    if (conversationId != null) {
      try {
        await this.dispatch(conversationActions.fetchConversation(conversationId));
      } catch {
        // Continue
      }
    }
  }
}
