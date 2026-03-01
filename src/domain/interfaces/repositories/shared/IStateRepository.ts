/**
 * State Repository Interface
 *
 * Contract for accessing and managing global state.
 * Abstracts Redux so domain/application layers don't depend on it directly.
 *
 * Implementation lives in infrastructure/repositories/shared/
 * (wrapping Redux store)
 */

import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';

/**
 * Repository interface for global state management
 */
export interface IStateRepository {
  // ============================================================================
  // AI Chat Session State
  // ============================================================================

  /**
   * Get the currently active chat session ID
   *
   * @returns Session ID or null if none active
   */
  getActiveChatSessionId(): string | null;

  /**
   * Set the active chat session ID
   *
   * @param id - Session ID to set as active, or null to clear
   */
  setActiveChatSessionId(id: string | null): void;

  /**
   * Get all cached chat sessions
   *
   * @returns Array of chat sessions
   */
  getChatSessions(): AIChatSession[];

  /**
   * Set chat sessions in state
   *
   * @param sessions - Sessions to store
   */
  setChatSessions(sessions: AIChatSession[]): void;

  // ============================================================================
  // Loading States
  // ============================================================================

  /**
   * Check if chat sessions are being loaded
   */
  isLoadingChatSessions(): boolean;

  /**
   * Check if messages are being loaded
   */
  isLoadingMessages(): boolean;

  /**
   * Set chat sessions loading state
   */
  setLoadingChatSessions(loading: boolean): void;

  /**
   * Set messages loading state
   */
  setLoadingMessages(loading: boolean): void;

  // ============================================================================
  // Reactivity
  // ============================================================================

  /**
   * Subscribe to state changes
   *
   * This is key for React hooks to re-render when state changes.
   *
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: () => void): () => void;
}
