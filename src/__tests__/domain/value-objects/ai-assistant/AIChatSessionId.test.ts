/**
 * Unit Tests for AIChatSessionId Value Object
 *
 * Tests the branded type factory functions, type guards,
 * and utility functions for AI chat session identifiers.
 */

import {
  createAIChatSessionId,
  createAIChatSessionIdOrNull,
  isAIChatSessionId,
  isValidAIChatSessionId,
  unwrapAIChatSessionId,
  areAIChatSessionIdsEqual,
} from '@/domain/value-objects/ai-assistant/AIChatSessionId';

describe('AIChatSessionId Value Object', () => {
  // ============================================================================
  // createAIChatSessionId Tests - Factory Function
  // ============================================================================

  describe('createAIChatSessionId', () => {
    it('should create AIChatSessionId from valid string', () => {
      const result = createAIChatSessionId('session-123');

      expect(result).toBe('session-123');
    });

    it('should trim whitespace from input', () => {
      const result = createAIChatSessionId('  session-456  ');

      expect(result).toBe('session-456');
    });

    it('should throw error for empty string', () => {
      expect(() => createAIChatSessionId('')).toThrow('AIChatSessionId must be a non-empty string');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => createAIChatSessionId('   ')).toThrow(
        'AIChatSessionId cannot be empty or whitespace',
      );
    });

    it('should throw error for null input', () => {
      expect(() => createAIChatSessionId(null as unknown as string)).toThrow(
        'AIChatSessionId must be a non-empty string',
      );
    });

    it('should throw error for undefined input', () => {
      expect(() => createAIChatSessionId(undefined as unknown as string)).toThrow(
        'AIChatSessionId must be a non-empty string',
      );
    });

    it('should throw error for non-string input', () => {
      expect(() => createAIChatSessionId(123 as unknown as string)).toThrow(
        'AIChatSessionId must be a non-empty string',
      );
    });
  });

  // ============================================================================
  // createAIChatSessionIdOrNull Tests - Safe Factory Function
  // ============================================================================

  describe('createAIChatSessionIdOrNull', () => {
    it('should return AIChatSessionId for valid string', () => {
      const result = createAIChatSessionIdOrNull('valid-session');

      expect(result).toBe('valid-session');
    });

    it('should return null for null input', () => {
      const result = createAIChatSessionIdOrNull(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = createAIChatSessionIdOrNull(undefined);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = createAIChatSessionIdOrNull('');

      expect(result).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      const result = createAIChatSessionIdOrNull('   ');

      expect(result).toBeNull();
    });

    it('should trim whitespace and return valid AIChatSessionId', () => {
      const result = createAIChatSessionIdOrNull('  trimmed  ');

      expect(result).toBe('trimmed');
    });

    it('should return null for non-string input', () => {
      const result = createAIChatSessionIdOrNull(42 as unknown as string);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // isAIChatSessionId Tests - Type Guard
  // ============================================================================

  describe('isAIChatSessionId', () => {
    it('should return true for non-empty string', () => {
      expect(isAIChatSessionId('session-id')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isAIChatSessionId('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isAIChatSessionId('   ')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAIChatSessionId(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAIChatSessionId(undefined)).toBe(false);
    });

    it('should return false for number', () => {
      expect(isAIChatSessionId(123)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isAIChatSessionId({ id: 'session' })).toBe(false);
    });
  });

  // ============================================================================
  // isValidAIChatSessionId Tests - Validation Function
  // ============================================================================

  describe('isValidAIChatSessionId', () => {
    it('should return true for valid session ID', () => {
      expect(isValidAIChatSessionId('valid-session-123')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidAIChatSessionId('')).toBe(false);
    });

    it('should return false for whitespace', () => {
      expect(isValidAIChatSessionId('  ')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidAIChatSessionId(null)).toBe(false);
      expect(isValidAIChatSessionId(undefined)).toBe(false);
      expect(isValidAIChatSessionId(100)).toBe(false);
    });
  });

  // ============================================================================
  // unwrapAIChatSessionId Tests - Utility Function
  // ============================================================================

  describe('unwrapAIChatSessionId', () => {
    it('should convert AIChatSessionId back to plain string', () => {
      const sessionId = createAIChatSessionId('my-session');

      const result = unwrapAIChatSessionId(sessionId);

      expect(result).toBe('my-session');
      expect(typeof result).toBe('string');
    });
  });

  // ============================================================================
  // areAIChatSessionIdsEqual Tests - Equality Comparison
  // ============================================================================

  describe('areAIChatSessionIdsEqual', () => {
    it('should return true for equal session IDs', () => {
      const id1 = createAIChatSessionId('session-same');
      const id2 = createAIChatSessionId('session-same');

      expect(areAIChatSessionIdsEqual(id1, id2)).toBe(true);
    });

    it('should return false for different session IDs', () => {
      const id1 = createAIChatSessionId('session-a');
      const id2 = createAIChatSessionId('session-b');

      expect(areAIChatSessionIdsEqual(id1, id2)).toBe(false);
    });

    it('should return true when both are null', () => {
      expect(areAIChatSessionIdsEqual(null, null)).toBe(true);
    });

    it('should return true when both are undefined', () => {
      expect(areAIChatSessionIdsEqual(undefined, undefined)).toBe(true);
    });

    it('should return false when one is null and other is valid', () => {
      const id = createAIChatSessionId('session-123');

      expect(areAIChatSessionIdsEqual(id, null)).toBe(false);
      expect(areAIChatSessionIdsEqual(null, id)).toBe(false);
    });

    it('should return false when one is undefined and other is valid', () => {
      const id = createAIChatSessionId('session-456');

      expect(areAIChatSessionIdsEqual(id, undefined)).toBe(false);
      expect(areAIChatSessionIdsEqual(undefined, id)).toBe(false);
    });
  });
});
