/**
 * Active AI Chat Session Storage Interface
 *
 * Contract for persisting the currently active chat session ID.
 * This allows the app to remember which conversation was last active.
 *
 * Implementation lives in infrastructure/repositories/ai-assistant/
 * (typically using AsyncStorage)
 */

import type { Result } from '@/domain/shared';
import type { AIChatSessionId } from '@/domain/value-objects/ai-assistant';

/**
 * Storage interface for the active chat session
 */
export interface IActiveAIChatSessionStorage {
  /**
   * Get the currently active chat session ID
   *
   * @returns Result containing the session ID or null if none active
   */
  getActiveAIChatSessionId(): Promise<Result<AIChatSessionId | null, Error>>;

  /**
   * Set the active chat session ID
   *
   * @param chatSessionId - The session ID to set as active
   * @returns Result indicating success or error
   */
  setActiveAIChatSessionId(chatSessionId: AIChatSessionId): Promise<Result<void, Error>>;

  /**
   * Clear the active chat session (no session active)
   *
   * @returns Result indicating success or error
   */
  clearActiveAIChatSessionId(): Promise<Result<void, Error>>;
}
