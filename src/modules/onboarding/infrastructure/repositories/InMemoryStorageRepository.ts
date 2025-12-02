import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { Result } from '../../domain/entities/Result';
import { StorageError } from '../../domain/entities/Errors';

/**
 * In-Memory Storage Repository Implementation
 *
 * Useful for testing or when persistence is not needed.
 * Data is lost when the app restarts.
 */
export class InMemoryStorageRepository implements IStorageRepository {
  private store: Map<string, unknown> = new Map<string, unknown>();

  async save(key: string, value: unknown): Promise<Result<void, Error>> {
    try {
      this.store.set(key, value);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to save to memory storage'),
      );
    }
  }

  async get<T = unknown>(key: string): Promise<Result<T | null, Error>> {
    try {
      const value = this.store.get(key);
      return Result.ok((value as T) ?? null);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to get from memory storage'),
      );
    }
  }

  async remove(key: string): Promise<Result<void, Error>> {
    try {
      this.store.delete(key);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to remove from memory storage'),
      );
    }
  }

  async exists(key: string): Promise<Result<boolean, Error>> {
    try {
      return Result.ok(this.store.has(key));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to check memory storage'),
      );
    }
  }

  async clear(): Promise<Result<void, Error>> {
    try {
      this.store.clear();
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to clear memory storage'),
      );
    }
  }
}
