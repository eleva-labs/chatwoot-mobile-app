/**
 * Unit Tests for useSessionStorage Hook
 *
 * Tests the React hook that resolves IActiveAIChatSessionStorage from the DI container.
 * Uses mocking to isolate the hook from the actual DI container.
 */

import { renderHook } from '@testing-library/react-hooks';
import { useSessionStorage } from '@/presentation/hooks/di/useSessionStorage';
import * as containerModule from '@/dependency-injection/container';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection/tokens';
import type { IActiveAIChatSessionStorage } from '@/domain/interfaces/repositories/ai-assistant';
import { Result } from '@/domain/shared/Result';
import { createAIChatSessionId, type AIChatSessionId } from '@/domain/value-objects/ai-assistant';

// Mock the DI container module
jest.mock('@/dependency-injection/container', () => ({
  resolve: jest.fn(),
}));

describe('useSessionStorage', () => {
  // Mock storage service implementation
  const mockStorageService: jest.Mocked<IActiveAIChatSessionStorage> = {
    getActiveAIChatSessionId: jest.fn(),
    setActiveAIChatSessionId: jest.fn(),
    clearActiveAIChatSessionId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (containerModule.resolve as jest.Mock).mockReturnValue(mockStorageService);
  });

  // ============================================================================
  // Service Resolution Tests
  // ============================================================================

  describe('service resolution', () => {
    it('should resolve IActiveAIChatSessionStorage from DI container with correct token', () => {
      const { result } = renderHook(() => useSessionStorage());

      expect(containerModule.resolve).toHaveBeenCalledWith(
        AI_ASSISTANT_TOKENS.IActiveAIChatSessionStorage,
      );
      expect(result.current).toBeDefined();
    });

    it('should return the resolved service instance', () => {
      const { result } = renderHook(() => useSessionStorage());

      expect(result.current).toBe(mockStorageService);
    });
  });

  // ============================================================================
  // Memoization Tests
  // ============================================================================

  describe('memoization', () => {
    it('should return the same instance on re-render', () => {
      const { result, rerender } = renderHook(() => useSessionStorage());

      const firstInstance = result.current;

      rerender();

      expect(result.current).toBe(firstInstance);
    });

    it('should only call resolve once even after multiple re-renders', () => {
      const { rerender } = renderHook(() => useSessionStorage());

      rerender();
      rerender();
      rerender();

      // useMemo should cache the result, so resolve is only called once
      expect(containerModule.resolve).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Service Method Accessibility Tests
  // ============================================================================

  describe('service methods', () => {
    it('should have getActiveAIChatSessionId method callable', async () => {
      const sessionId = createAIChatSessionId('session-123');
      mockStorageService.getActiveAIChatSessionId.mockResolvedValue(
        Result.ok(sessionId) as Result<AIChatSessionId | null, Error>,
      );

      const { result } = renderHook(() => useSessionStorage());

      expect(typeof result.current.getActiveAIChatSessionId).toBe('function');

      const response = await result.current.getActiveAIChatSessionId();
      expect(mockStorageService.getActiveAIChatSessionId).toHaveBeenCalled();
      expect(response.isSuccess).toBe(true);
    });

    it('should have setActiveAIChatSessionId method callable', async () => {
      mockStorageService.setActiveAIChatSessionId.mockResolvedValue(Result.ok(undefined));

      const { result } = renderHook(() => useSessionStorage());

      expect(typeof result.current.setActiveAIChatSessionId).toBe('function');
    });

    it('should have clearActiveAIChatSessionId method callable', async () => {
      mockStorageService.clearActiveAIChatSessionId.mockResolvedValue(Result.ok(undefined));

      const { result } = renderHook(() => useSessionStorage());

      expect(typeof result.current.clearActiveAIChatSessionId).toBe('function');
    });

    it('should return session ID when getActiveAIChatSessionId succeeds', async () => {
      const sessionId = createAIChatSessionId('active-session-id');
      mockStorageService.getActiveAIChatSessionId.mockResolvedValue(
        Result.ok(sessionId) as Result<AIChatSessionId | null, Error>,
      );

      const { result } = renderHook(() => useSessionStorage());

      const response = await result.current.getActiveAIChatSessionId();
      expect(response.isSuccess).toBe(true);
      expect(response.getValue()).toBe(sessionId);
    });

    it('should return null when no active session exists', async () => {
      mockStorageService.getActiveAIChatSessionId.mockResolvedValue(
        Result.ok(null) as Result<AIChatSessionId | null, Error>,
      );

      const { result } = renderHook(() => useSessionStorage());

      const response = await result.current.getActiveAIChatSessionId();
      expect(response.isSuccess).toBe(true);
      expect(response.getValue()).toBeNull();
    });
  });
});
