import { injectable } from 'tsyringe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { Result } from '../../domain/entities/Result';
import { StorageError } from '../../domain/entities/Errors';

/**
 * AsyncStorage Repository Implementation
 *
 * Uses React Native's AsyncStorage for local persistence.
 */
@injectable()
export class AsyncStorageRepository implements IStorageRepository {
  async save(key: string, value: unknown): Promise<Result<void, Error>> {
    try {
      const serialized: string = JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? new StorageError('Failed to save', error)
          : new StorageError('Failed to save', error as Error),
      );
    }
  }

  async get<T = unknown>(key: string): Promise<Result<T | null, Error>> {
    try {
      const value: string | null = await AsyncStorage.getItem(key);
      if (value === null) {
        return Result.ok(null);
      }

      const parsed: T = JSON.parse(value) as T;
      return Result.ok(parsed);
    } catch (error) {
      // If JSON parse fails, return failure with error message
      if (error instanceof SyntaxError) {
        return Result.fail(new StorageError('Failed to get', error));
      }

      return Result.fail(
        error instanceof Error
          ? new StorageError('Failed to get', error)
          : new StorageError('Failed to get', error as Error),
      );
    }
  }

  async remove(key: string): Promise<Result<void, Error>> {
    try {
      await AsyncStorage.removeItem(key);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? new StorageError('Failed to remove', error)
          : new StorageError('Failed to remove', error as Error),
      );
    }
  }

  async exists(key: string): Promise<Result<boolean, Error>> {
    try {
      const value: string | null = await AsyncStorage.getItem(key);
      return Result.ok(value !== null);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? error
          : new StorageError('Failed to check storage', error as Error),
      );
    }
  }

  async clear(): Promise<Result<void, Error>> {
    try {
      await AsyncStorage.clear();
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? new StorageError('Failed to clear', error)
          : new StorageError('Failed to clear', error as Error),
      );
    }
  }
}
