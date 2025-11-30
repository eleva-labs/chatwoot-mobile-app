/**
 * Tests for AsyncStorageRepository
 *
 * AsyncStorageRepository wraps React Native AsyncStorage
 * with Result pattern for type-safe error handling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageRepository } from '../../../infrastructure/storage/AsyncStorageRepository';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('AsyncStorageRepository', () => {
  let repository: AsyncStorageRepository;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    repository = new AsyncStorageRepository();
    jest.clearAllMocks();
  });

  describe('save()', () => {
    it('should save string value successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('key1', 'value1');

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('key1', JSON.stringify('value1'));
    });

    it('should save object value successfully', async () => {
      const obj = { name: 'John', age: 30 };
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('user', obj);

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(obj));
    });

    it('should save array value successfully', async () => {
      const arr = [1, 2, 3, 4, 5];
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('numbers', arr);

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('numbers', JSON.stringify(arr));
    });

    it('should save boolean value successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('flag', true);

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('flag', JSON.stringify(true));
    });

    it('should save number value successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('count', 42);

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('count', JSON.stringify(42));
    });

    it('should save null value successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('nullable', null);

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('nullable', JSON.stringify(null));
    });

    it('should return failure when AsyncStorage fails', async () => {
      const error = new Error('Storage is full');
      mockAsyncStorage.setItem.mockRejectedValue(error);

      const result = await repository.save('key', 'value');

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Failed to save');
    });

    it('should handle serialization errors', async () => {
      interface Circular {
        self?: Circular;
      }
      const circular: Circular = {};
      circular.self = circular; // Circular reference

      const result = await repository.save('circular', circular);

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Failed to save');
    });

    it('should overwrite existing value', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await repository.save('key', 'first');
      await repository.save('key', 'second');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2);
      expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith('key', JSON.stringify('second'));
    });
  });

  describe('get()', () => {
    it('should get existing string value', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('value'));

      const result = await repository.get<string>('key');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe('value');
    });

    it('should get existing object value', async () => {
      const obj = { name: 'John', age: 30 };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(obj));

      const result = await repository.get<typeof obj>('user');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(obj);
    });

    it('should get existing array value', async () => {
      const arr = [1, 2, 3];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(arr));

      const result = await repository.get<number[]>('numbers');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(arr);
    });

    it('should return null for non-existent key', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await repository.get<string>('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeNull();
    });

    it('should return failure when AsyncStorage fails', async () => {
      const error = new Error('Storage error');
      mockAsyncStorage.getItem.mockRejectedValue(error);

      const result = await repository.get<string>('key');

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Failed to get');
    });

    it('should handle invalid JSON gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json{');

      const result = await repository.get<unknown>('key');

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Failed to get');
    });

    it('should preserve type through generic', async () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'Alice' };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(user));

      const result = await repository.get<User>('user');

      expect(result.isSuccess).toBe(true);
      const retrieved = result.getValue();
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.name).toBe('Alice');
    });
  });

  describe('remove()', () => {
    it('should remove existing key successfully', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const result = await repository.remove('key');

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('key');
    });

    it('should succeed even if key does not exist', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const result = await repository.remove('nonexistent');

      expect(result.isSuccess).toBe(true);
    });

    it('should return failure when AsyncStorage fails', async () => {
      const error = new Error('Storage error');
      mockAsyncStorage.removeItem.mockRejectedValue(error);

      const result = await repository.remove('key');

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Failed to remove');
    });
  });

  describe('exists()', () => {
    it('should return true for existing key', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('value'));

      const result = await repository.exists('key');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await repository.exists('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(false);
    });

    it('should return failure when AsyncStorage fails', async () => {
      const error = new Error('Storage error');
      mockAsyncStorage.getItem.mockRejectedValue(error);

      const result = await repository.exists('key');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('clear()', () => {
    it('should clear all storage successfully', async () => {
      mockAsyncStorage.clear.mockResolvedValue(undefined);

      const result = await repository.clear();

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.clear).toHaveBeenCalled();
    });

    it('should return failure when AsyncStorage fails', async () => {
      const error = new Error('Storage error');
      mockAsyncStorage.clear.mockRejectedValue(error);

      const result = await repository.clear();

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Failed to clear');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle save and retrieve workflow', async () => {
      const data = { id: 1, name: 'Test' };
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(data));

      const saveResult = await repository.save('test', data);
      const getResult = await repository.get<typeof data>('test');

      expect(saveResult.isSuccess).toBe(true);
      expect(getResult.isSuccess).toBe(true);
      expect(getResult.getValue()).toEqual(data);
    });

    it('should handle save, remove, and verify workflow', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify('value'))
        .mockResolvedValueOnce(null);

      await repository.save('key', 'value');
      const existsBefore = await repository.exists('key');
      await repository.remove('key');
      const existsAfter = await repository.exists('key');

      expect(existsBefore.getValue()).toBe(true);
      expect(existsAfter.getValue()).toBe(false);
    });

    it('should handle multiple keys independently', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockImplementation(key => {
        if (key === 'key1') return Promise.resolve(JSON.stringify('value1'));
        if (key === 'key2') return Promise.resolve(JSON.stringify('value2'));
        return Promise.resolve(null);
      });

      await repository.save('key1', 'value1');
      await repository.save('key2', 'value2');

      const result1 = await repository.get<string>('key1');
      const result2 = await repository.get<string>('key2');

      expect(result1.getValue()).toBe('value1');
      expect(result2.getValue()).toBe('value2');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string key', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('', 'value');

      expect(result.isSuccess).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('', JSON.stringify('value'));
    });

    it('should handle very long keys', async () => {
      const longKey = 'k'.repeat(1000);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save(longKey, 'value');

      expect(result.isSuccess).toBe(true);
    });

    it('should handle very large data', async () => {
      const largeData = 'x'.repeat(1000000); // 1MB string
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save('large', largeData);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'key@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await repository.save(specialKey, 'value');

      expect(result.isSuccess).toBe(true);
    });

    it('should handle unicode in values', async () => {
      const unicode = '你好世界 🌍 مرحبا';
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(unicode));

      await repository.save('unicode', unicode);
      const result = await repository.get<string>('unicode');

      expect(result.getValue()).toBe(unicode);
    });

    it('should handle nested objects', async () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(nested));

      await repository.save('nested', nested);
      const result = await repository.get<typeof nested>('nested');

      expect(result.getValue()).toEqual(nested);
    });

    it('should handle Date objects', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(date));

      await repository.save('date', date);
      const result = await repository.get<string>('date');

      // Dates are serialized to ISO strings
      expect(result.getValue()).toBe(date.toISOString());
    });
  });

  describe('Performance', () => {
    it('should handle rapid sequential operations', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const promises = Array.from({ length: 100 }, (_, i) =>
        repository.save(`key${i}`, `value${i}`),
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r.isSuccess)).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(100);
    });

    it('should handle concurrent read operations', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('value'));

      const promises = Array.from({ length: 50 }, () => repository.get<string>('sharedKey'));

      const results = await Promise.all(promises);

      expect(results.every(r => r.isSuccess)).toBe(true);
      expect(results.every(r => r.getValue() === 'value')).toBe(true);
    });
  });
});
