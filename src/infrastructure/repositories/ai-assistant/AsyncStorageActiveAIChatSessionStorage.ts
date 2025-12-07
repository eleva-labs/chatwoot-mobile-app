/**
 * AsyncStorage Active AI Chat Session Storage
 *
 * Implements IActiveAIChatSessionStorage to persist active session ID
 * using React Native's AsyncStorage.
 */

import { injectable } from 'tsyringe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Result } from '@/domain/shared';
import type { IActiveAIChatSessionStorage } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSessionId } from '@/domain/value-objects/ai-assistant';
import { createAIChatSessionId, isValidAIChatSessionId } from '@/domain/value-objects/ai-assistant';

/**
 * Storage key for active session ID
 */
const ACTIVE_SESSION_KEY = '@ai_chat/active_session_id';

/**
 * Persists active AI chat session ID to AsyncStorage
 */
@injectable()
export class AsyncStorageActiveAIChatSessionStorage implements IActiveAIChatSessionStorage {
  /**
   * Get the currently active chat session ID
   */
  async getActiveAIChatSessionId(): Promise<Result<AIChatSessionId | null, Error>> {
    try {
      const storedValue = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);

      if (!storedValue) {
        return Result.ok(null);
      }

      // Validate the stored value
      if (!isValidAIChatSessionId(storedValue)) {
        // Invalid stored value - clear it and return null
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        return Result.ok(null);
      }

      return Result.ok(createAIChatSessionId(storedValue));
    } catch (error) {
      const err = error as Error;
      return Result.fail(new Error(`Failed to get active session ID: ${err.message}`));
    }
  }

  /**
   * Set the active chat session ID
   */
  async setActiveAIChatSessionId(chatSessionId: AIChatSessionId): Promise<Result<void, Error>> {
    try {
      // The branded type ensures this is a valid string
      await AsyncStorage.setItem(ACTIVE_SESSION_KEY, chatSessionId as string);
      return Result.ok(undefined);
    } catch (error) {
      const err = error as Error;
      return Result.fail(new Error(`Failed to set active session ID: ${err.message}`));
    }
  }

  /**
   * Clear the active chat session
   */
  async clearActiveAIChatSessionId(): Promise<Result<void, Error>> {
    try {
      await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
      return Result.ok(undefined);
    } catch (error) {
      const err = error as Error;
      return Result.fail(new Error(`Failed to clear active session ID: ${err.message}`));
    }
  }
}
