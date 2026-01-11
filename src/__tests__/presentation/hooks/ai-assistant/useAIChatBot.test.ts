/**
 * Unit Tests for useAIChatBot Hook
 *
 * Tests the hook for managing AI chat bot selection and fetching.
 */

// Mock the factory module before imports to prevent import chain issues
jest.mock('@/presentation/factory/ai-assistant', () => ({
  getDefaultAIAssistantDependencies: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { useAIChatBot } from '@/presentation/hooks/ai-assistant/useAIChatBot';
import * as factoryModule from '@/presentation/factory/ai-assistant';
import { Result } from '@/domain/shared/Result';
import type { AIBot } from '@/domain/entities/ai-assistant';
import { createBotId } from '@/domain/value-objects/ai-assistant';

// Helper function to wait for async operations
const waitForNextUpdate = async (result: { current: unknown }, ms = 100) => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms));
  });
};

describe('useAIChatBot', () => {
  // Mock use case
  const mockFetchBotsUseCase = {
    execute: jest.fn(),
  };

  // Sample bot data
  const mockBots: AIBot[] = [
    {
      id: createBotId(1),
      name: 'Bot One',
      description: 'First bot',
      avatarUrl: 'https://example.com/1.png',
    },
    {
      id: createBotId(2),
      name: 'Bot Two',
      description: 'Second bot',
      avatarUrl: 'https://example.com/2.png',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (factoryModule.getDefaultAIAssistantDependencies as jest.Mock).mockReturnValue({
      fetchBotsUseCase: mockFetchBotsUseCase,
    });
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initialization', () => {
    it('should initialize with loading false and no error when no accountId', () => {
      // Without accountId, the hook won't fetch so no execute call is made
      const { result } = renderHook(() => useAIChatBot(undefined, undefined));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should get fetchBotsUseCase from factory', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      renderHook(() => useAIChatBot(undefined, 123));

      expect(factoryModule.getDefaultAIAssistantDependencies).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Fetching Tests
  // ============================================================================

  describe('fetching behavior', () => {
    it('should not fetch if accountId is undefined', () => {
      renderHook(() => useAIChatBot(undefined, undefined));

      expect(mockFetchBotsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should fetch bots when accountId is provided', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      const { result } = renderHook(() => useAIChatBot(undefined, 123));

      await waitForNextUpdate(result);

      expect(mockFetchBotsUseCase.execute).toHaveBeenCalledWith({ accountId: 123 });
    });

    it('should set isLoading false after fetch completes', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      const { result } = renderHook(() => useAIChatBot(undefined, 123));

      await waitForNextUpdate(result);

      // Should stop loading after resolve
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // Selection Tests
  // ============================================================================

  describe('bot selection', () => {
    it('should set selectedBot when agentBotId matches a bot', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      const { result } = renderHook(() => useAIChatBot(2, 123));

      await waitForNextUpdate(result);

      expect(result.current.selectedBotId).toBe(2);
      expect(result.current.selectedBot?.id).toBe(2);
    });

    it('should auto-select first bot when no agentBotId provided', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      const { result } = renderHook(() => useAIChatBot(undefined, 123));

      await waitForNextUpdate(result);

      expect(result.current.selectedBotId).toBe(1);
      expect(result.current.selectedBot?.id).toBe(1);
    });

    it('should update selectedBotId via setSelectedBotId', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      const { result } = renderHook(() => useAIChatBot(undefined, 123));

      await waitForNextUpdate(result);

      expect(result.current.selectedBotId).toBe(1);

      act(() => {
        result.current.setSelectedBotId(2);
      });

      expect(result.current.selectedBotId).toBe(2);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    it('should set error state when use case fails', async () => {
      const error = new Error('Failed to fetch bots');
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.fail(error));

      const { result } = renderHook(() => useAIChatBot(undefined, 123));

      await waitForNextUpdate(result);

      expect(result.current.error).toBe(error);
    });

    it('should log error when fetch fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Network error');
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.fail(error));

      const { result } = renderHook(() => useAIChatBot(undefined, 123));

      await waitForNextUpdate(result);

      expect(consoleSpy).toHaveBeenCalledWith('[useAIChatBot] Failed to fetch bots:', error);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // DTO Mapping Tests
  // ============================================================================

  describe('DTO mapping', () => {
    it('should map domain entity to DTO format for backwards compatibility', async () => {
      mockFetchBotsUseCase.execute.mockResolvedValue(Result.ok(mockBots));

      const { result } = renderHook(() => useAIChatBot(1, 123));

      await waitForNextUpdate(result);

      expect(result.current.selectedBot).toMatchObject({
        id: 1,
        name: 'Bot One',
        description: 'First bot',
        avatar_url: 'https://example.com/1.png',
      });
    });
  });
});
