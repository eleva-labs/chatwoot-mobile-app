/**
 * Unit Tests for FetchBotsUseCase
 *
 * Tests the use case that retrieves all available AI bots for an account.
 */

import 'reflect-metadata';

// Mock the dependency-injection module to prevent import chain issues
jest.mock('@/dependency-injection', () => ({
  AI_ASSISTANT_TOKENS: {
    IAIBotRepository: Symbol('IAIBotRepository'),
  },
}));

import { FetchBotsUseCase } from '@/application/use-cases/ai-assistant/FetchBotsUseCase';
import type { IAIBotRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIBot } from '@/domain/entities/ai-assistant';
import { Result } from '@/domain/shared/Result';
import { createBotId } from '@/domain/value-objects/ai-assistant';

describe('FetchBotsUseCase', () => {
  let useCase: FetchBotsUseCase;
  let mockBotRepository: jest.Mocked<IAIBotRepository>;

  // Sample bot data for tests
  const mockBots: AIBot[] = [
    {
      id: createBotId(1),
      name: 'Assistant Bot',
      description: 'A helpful assistant',
      avatarUrl: 'https://example.com/avatar1.png',
    },
    {
      id: createBotId(2),
      name: 'Support Bot',
      description: 'Customer support bot',
      avatarUrl: 'https://example.com/avatar2.png',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockBotRepository = {
      fetchBots: jest.fn(),
      fetchBotById: jest.fn(),
    };

    useCase = new FetchBotsUseCase(mockBotRepository);
  });

  // ============================================================================
  // Successful Execution Tests
  // ============================================================================

  describe('successful execution', () => {
    it('should call repository with correct parameters', async () => {
      mockBotRepository.fetchBots.mockResolvedValue(Result.ok(mockBots));

      await useCase.execute({ accountId: 123 });

      expect(mockBotRepository.fetchBots).toHaveBeenCalledWith({ accountId: 123 });
      expect(mockBotRepository.fetchBots).toHaveBeenCalledTimes(1);
    });

    it('should return bots on success', async () => {
      mockBotRepository.fetchBots.mockResolvedValue(Result.ok(mockBots));

      const result = await useCase.execute({ accountId: 123 });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(mockBots);
    });

    it('should return empty array when no bots exist', async () => {
      mockBotRepository.fetchBots.mockResolvedValue(Result.ok([]));

      const result = await useCase.execute({ accountId: 456 });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should pass through repository result directly', async () => {
      const expectedBots: AIBot[] = [
        { id: createBotId(5), name: 'Custom Bot', description: 'Custom', avatarUrl: undefined },
      ];
      mockBotRepository.fetchBots.mockResolvedValue(Result.ok(expectedBots));

      const result = await useCase.execute({ accountId: 789 });

      expect(result.getValue()).toBe(expectedBots);
    });
  });

  // ============================================================================
  // Failure Execution Tests
  // ============================================================================

  describe('failure execution', () => {
    it('should return failure when repository fails', async () => {
      const error = new Error('Network error');
      mockBotRepository.fetchBots.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ accountId: 123 });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should propagate repository error message', async () => {
      const error = new Error('Authentication failed');
      mockBotRepository.fetchBots.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ accountId: 123 });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('Authentication failed');
    });

    it('should handle rejected promise from repository', async () => {
      const error = new Error('Unexpected error');
      mockBotRepository.fetchBots.mockRejectedValue(error);

      await expect(useCase.execute({ accountId: 123 })).rejects.toThrow('Unexpected error');
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('edge cases', () => {
    it('should handle single bot result', async () => {
      const singleBot: AIBot[] = [
        { id: createBotId(1), name: 'Solo Bot', description: '', avatarUrl: undefined },
      ];
      mockBotRepository.fetchBots.mockResolvedValue(Result.ok(singleBot));

      const result = await useCase.execute({ accountId: 100 });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
    });
  });
});
