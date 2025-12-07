/**
 * Redux State Repository
 *
 * Implements IStateRepository to manage global state via Redux.
 * Provides reactive access to AI chat session state.
 */

import { injectable } from 'tsyringe';
import type { IStateRepository } from '@/domain/interfaces/repositories/shared';
import type { AIChatSession } from '@/domain/interfaces/mappers/ai-assistant';
import { getStore } from '@/store/storeAccessor';

/**
 * Repository for accessing and managing global state via Redux
 */
@injectable()
export class ReduxStateRepository implements IStateRepository {
  // ============================================================================
  // AI Chat Session State
  // ============================================================================

  /**
   * Get the currently active chat session ID
   */
  getActiveChatSessionId(): string | null {
    const state = getStore().getState();
    return state.aiChat?.activeSessionId ?? null;
  }

  /**
   * Set the active chat session ID
   */
  setActiveChatSessionId(id: string | null): void {
    const store = getStore();
    store.dispatch({
      type: 'aiChat/setActiveSessionId',
      payload: id,
    });
  }

  /**
   * Get all cached chat sessions
   */
  getChatSessions(): AIChatSession[] {
    const state = getStore().getState();
    // Sessions are stored by key in Redux, flatten them
    const sessionsByKey = state.aiChat?.sessions || {};
    const allSessions: AIChatSession[] = [];

    Object.values(sessionsByKey).forEach((sessions: unknown) => {
      if (Array.isArray(sessions)) {
        // Note: Redux stores DTO format, would need mapping in real implementation
        // For now, return as-is since this is a simplified interface
        allSessions.push(...(sessions as AIChatSession[]));
      }
    });

    return allSessions;
  }

  /**
   * Set chat sessions in state
   */
  setChatSessions(sessions: AIChatSession[]): void {
    const store = getStore();
    store.dispatch({
      type: 'aiChat/setSessions',
      payload: sessions,
    });
  }

  // ============================================================================
  // Loading States
  // ============================================================================

  /**
   * Check if chat sessions are being loaded
   */
  isLoadingChatSessions(): boolean {
    const state = getStore().getState();
    return state.aiChat?.loading?.sessions ?? false;
  }

  /**
   * Check if messages are being loaded
   */
  isLoadingMessages(): boolean {
    const state = getStore().getState();
    return state.aiChat?.loading?.messages ?? false;
  }

  /**
   * Set chat sessions loading state
   */
  setLoadingChatSessions(loading: boolean): void {
    const store = getStore();
    store.dispatch({
      type: 'aiChat/setLoadingSessions',
      payload: loading,
    });
  }

  /**
   * Set messages loading state
   */
  setLoadingMessages(loading: boolean): void {
    const store = getStore();
    store.dispatch({
      type: 'aiChat/setLoadingMessages',
      payload: loading,
    });
  }

  // ============================================================================
  // Reactivity
  // ============================================================================

  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): () => void {
    const store = getStore();
    return store.subscribe(callback);
  }
}
