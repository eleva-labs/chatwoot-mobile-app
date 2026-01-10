/**
 * Unit Tests for useAIChatConfig Hook
 *
 * Tests the React hook that resolves IAIChatConfigService from the DI container.
 * Uses mocking to isolate the hook from the actual DI container.
 */

import { renderHook } from '@testing-library/react-hooks';
import { useAIChatConfig } from '@/presentation/hooks/di/useAIChatConfig';
import * as containerModule from '@/dependency-injection/container';
import { SHARED_TOKENS } from '@/dependency-injection/tokens';
import type { IAIChatConfigService } from '@/domain/interfaces/services/shared';

// Mock the DI container module
jest.mock('@/dependency-injection/container', () => ({
  resolve: jest.fn(),
}));

describe('useAIChatConfig', () => {
  // Mock service implementation
  const mockConfigService: jest.Mocked<IAIChatConfigService> = {
    getAuthHeaders: jest.fn(() => ({})),
    getBaseURL: jest.fn(() => 'https://example.com'),
    getAIBackendUrl: jest.fn(() => null),
    getAccountId: jest.fn(() => 123),
    getUserId: jest.fn(() => 1),
    isAuthenticated: jest.fn(() => true),
    buildStreamEndpoint: jest.fn(() => 'https://example.com/api/v1/accounts/123/ai_chat/stream'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (containerModule.resolve as jest.Mock).mockReturnValue(mockConfigService);
  });

  // ============================================================================
  // Service Resolution Tests
  // ============================================================================

  describe('service resolution', () => {
    it('should resolve IAIChatConfigService from DI container', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(containerModule.resolve).toHaveBeenCalledWith(SHARED_TOKENS.IAIChatConfigService);
      expect(result.current).toBeDefined();
    });

    it('should return the resolved service instance', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(result.current).toBe(mockConfigService);
    });
  });

  // ============================================================================
  // Memoization Tests
  // ============================================================================

  describe('memoization', () => {
    it('should return the same instance on re-render', () => {
      const { result, rerender } = renderHook(() => useAIChatConfig());

      const firstInstance = result.current;

      rerender();

      expect(result.current).toBe(firstInstance);
    });

    it('should only call resolve once even after multiple re-renders', () => {
      const { rerender } = renderHook(() => useAIChatConfig());

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
    it('should have getAuthHeaders method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.getAuthHeaders).toBe('function');

      const headers = result.current.getAuthHeaders();
      expect(headers).toEqual({});
      expect(mockConfigService.getAuthHeaders).toHaveBeenCalled();
    });

    it('should have getBaseURL method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.getBaseURL).toBe('function');

      const baseURL = result.current.getBaseURL();
      expect(baseURL).toBe('https://example.com');
      expect(mockConfigService.getBaseURL).toHaveBeenCalled();
    });

    it('should have getAIBackendUrl method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.getAIBackendUrl).toBe('function');

      const aiBackendUrl = result.current.getAIBackendUrl();
      expect(aiBackendUrl).toBeNull();
      expect(mockConfigService.getAIBackendUrl).toHaveBeenCalled();
    });

    it('should have getAccountId method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.getAccountId).toBe('function');

      const accountId = result.current.getAccountId();
      expect(accountId).toBe(123);
      expect(mockConfigService.getAccountId).toHaveBeenCalled();
    });

    it('should have getUserId method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.getUserId).toBe('function');

      const userId = result.current.getUserId();
      expect(userId).toBe(1);
      expect(mockConfigService.getUserId).toHaveBeenCalled();
    });

    it('should have isAuthenticated method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.isAuthenticated).toBe('function');

      const isAuth = result.current.isAuthenticated();
      expect(isAuth).toBe(true);
      expect(mockConfigService.isAuthenticated).toHaveBeenCalled();
    });

    it('should have buildStreamEndpoint method callable', () => {
      const { result } = renderHook(() => useAIChatConfig());

      expect(typeof result.current.buildStreamEndpoint).toBe('function');

      const endpoint = result.current.buildStreamEndpoint();
      expect(endpoint).toBe('https://example.com/api/v1/accounts/123/ai_chat/stream');
      expect(mockConfigService.buildStreamEndpoint).toHaveBeenCalled();
    });

    it('should pass arguments to buildStreamEndpoint', () => {
      mockConfigService.buildStreamEndpoint.mockReturnValue('https://ai.backend.com/chat/stream');

      const { result } = renderHook(() => useAIChatConfig());

      const endpoint = result.current.buildStreamEndpoint('https://ai.backend.com');

      expect(mockConfigService.buildStreamEndpoint).toHaveBeenCalledWith('https://ai.backend.com');
      expect(endpoint).toBe('https://ai.backend.com/chat/stream');
    });
  });
});
