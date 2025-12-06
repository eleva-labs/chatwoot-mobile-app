import { Result } from '../entities/Result';

/**
 * Storage Repository Interface (Port)
 *
 * Defines the contract for local storage operations.
 * Implementations can use AsyncStorage, MMKV, or in-memory storage.
 */
export interface IStorageRepository {
  /**
   * Save a value to storage
   */
  save(key: string, value: unknown): Promise<Result<void, Error>>;

  /**
   * Get a value from storage
   */
  get<T = unknown>(key: string): Promise<Result<T | null, Error>>;

  /**
   * Remove a value from storage
   */
  remove(key: string): Promise<Result<void, Error>>;

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<Result<boolean, Error>>;

  /**
   * Clear all storage (optional - for testing/reset)
   */
  clear(): Promise<Result<void, Error>>;
}
