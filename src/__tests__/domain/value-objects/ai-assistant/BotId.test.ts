/**
 * Unit Tests for BotId Value Object
 *
 * Tests the branded type factory functions, type guards,
 * and utility functions for AI bot identifiers.
 */

import {
  createBotId,
  createBotIdOrNull,
  isBotId,
  unwrapBotId,
  areBotIdsEqual,
} from '@/domain/value-objects/ai-assistant/BotId';

describe('BotId Value Object', () => {
  // ============================================================================
  // createBotId Tests - Factory Function
  // ============================================================================

  describe('createBotId', () => {
    it('should create BotId from valid positive integer', () => {
      const result = createBotId(42);

      expect(result).toBe(42);
    });

    it('should create BotId from 1 (minimum valid value)', () => {
      const result = createBotId(1);

      expect(result).toBe(1);
    });

    it('should create BotId from large positive integer', () => {
      const result = createBotId(999999);

      expect(result).toBe(999999);
    });

    it('should throw error for zero', () => {
      expect(() => createBotId(0)).toThrow('BotId must be a positive integer');
    });

    it('should throw error for negative number', () => {
      expect(() => createBotId(-1)).toThrow('BotId must be a positive integer');
    });

    it('should throw error for decimal number', () => {
      expect(() => createBotId(3.14)).toThrow('BotId must be a positive integer');
    });

    it('should throw error for NaN', () => {
      expect(() => createBotId(NaN)).toThrow('BotId must be a positive integer');
    });

    it('should throw error for Infinity', () => {
      expect(() => createBotId(Infinity)).toThrow('BotId must be a positive integer');
    });

    it('should throw error for non-number input', () => {
      expect(() => createBotId('42' as unknown as number)).toThrow(
        'BotId must be a positive integer',
      );
    });
  });

  // ============================================================================
  // createBotIdOrNull Tests - Safe Factory Function
  // ============================================================================

  describe('createBotIdOrNull', () => {
    it('should return BotId for valid positive integer', () => {
      const result = createBotIdOrNull(123);

      expect(result).toBe(123);
    });

    it('should return null for null input', () => {
      const result = createBotIdOrNull(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = createBotIdOrNull(undefined);

      expect(result).toBeNull();
    });

    it('should return null for zero', () => {
      const result = createBotIdOrNull(0);

      expect(result).toBeNull();
    });

    it('should return null for negative number', () => {
      const result = createBotIdOrNull(-5);

      expect(result).toBeNull();
    });

    it('should return null for decimal number', () => {
      const result = createBotIdOrNull(2.5);

      expect(result).toBeNull();
    });

    it('should return null for non-number input', () => {
      const result = createBotIdOrNull('10' as unknown as number);

      expect(result).toBeNull();
    });

    it('should return null for NaN', () => {
      const result = createBotIdOrNull(NaN);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // isBotId Tests - Type Guard
  // ============================================================================

  describe('isBotId', () => {
    it('should return true for positive integer', () => {
      expect(isBotId(1)).toBe(true);
      expect(isBotId(100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isBotId(0)).toBe(false);
    });

    it('should return false for negative number', () => {
      expect(isBotId(-10)).toBe(false);
    });

    it('should return false for decimal number', () => {
      expect(isBotId(1.5)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isBotId(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isBotId(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isBotId('42')).toBe(false);
    });

    it('should return false for object', () => {
      expect(isBotId({ id: 1 })).toBe(false);
    });

    it('should return false for array', () => {
      expect(isBotId([1])).toBe(false);
    });
  });

  // ============================================================================
  // unwrapBotId Tests - Utility Function
  // ============================================================================

  describe('unwrapBotId', () => {
    it('should convert BotId back to plain number', () => {
      const botId = createBotId(77);

      const result = unwrapBotId(botId);

      expect(result).toBe(77);
      expect(typeof result).toBe('number');
    });

    it('should return the same numeric value', () => {
      const botId = createBotId(999);

      expect(unwrapBotId(botId)).toStrictEqual(999);
    });
  });

  // ============================================================================
  // areBotIdsEqual Tests - Equality Comparison
  // ============================================================================

  describe('areBotIdsEqual', () => {
    it('should return true for equal bot IDs', () => {
      const id1 = createBotId(5);
      const id2 = createBotId(5);

      expect(areBotIdsEqual(id1, id2)).toBe(true);
    });

    it('should return false for different bot IDs', () => {
      const id1 = createBotId(5);
      const id2 = createBotId(10);

      expect(areBotIdsEqual(id1, id2)).toBe(false);
    });

    it('should return true when both are null', () => {
      expect(areBotIdsEqual(null, null)).toBe(true);
    });

    it('should return true when both are undefined', () => {
      expect(areBotIdsEqual(undefined, undefined)).toBe(true);
    });

    it('should return false when one is null and other is valid', () => {
      const id = createBotId(10);

      expect(areBotIdsEqual(id, null)).toBe(false);
      expect(areBotIdsEqual(null, id)).toBe(false);
    });

    it('should return false when one is undefined and other is valid', () => {
      const id = createBotId(20);

      expect(areBotIdsEqual(id, undefined)).toBe(false);
      expect(areBotIdsEqual(undefined, id)).toBe(false);
    });

    it('should handle null and undefined as equal', () => {
      // Both null and undefined are "not set", so they should be considered equal
      expect(areBotIdsEqual(null, undefined)).toBe(false);
      expect(areBotIdsEqual(undefined, null)).toBe(false);
    });
  });
});
