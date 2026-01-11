/**
 * Unit Tests for FetchAIChatSessionsUseCase
 *
 * Tests the use case that retrieves chat sessions for a specific bot.
 */

import 'reflect-metadata';

// Mock the dependency-injection module to prevent import chain issues
jest.mock('@/dependency-injection', () => ({
  AI_ASSISTANT_TOKENS: {
    IAIChatSessionRepository: Symbol('IAIChatSessionRepository'),
  },
}));

import { FetchAIChatSessionsUseCase } from '@/application/use-cases/ai-assistant/FetchAIChatSessionsUseCase';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';
import { Result } from '@/domain/shared/Result';
import { createAIChatSessionId } from '@/domain/value-objects/ai-assistant';

describe('FetchAIChatSessionsUseCase', () => {
  let useCase: FetchAIChatSessionsUseCase;
  let mockSessionRepository: jest.Mocked<IAIChatSessionRepository>;

  // Sample session data for tests
  const mockSessions: AIChatSession[] = [
    {
      id: createAIChatSessionId('session-1'),
      agentBotId: 1,
      accountId: 123,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: createAIChatSessionId('session-2'),
      agentBotId: 1,
      accountId: 123,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      updatedAt: new Date('2024-01-15T11:30:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionRepository = {
      fetchSessions: jest.fn(),
      fetchMessages: jest.fn(),
      createSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
    };

    useCase = new FetchAIChatSessionsUseCase(mockSessionRepository);
  });

  // ============================================================================
  // Successful Execution Tests
  // ============================================================================

  describe('successful execution', () => {
    it('should call repository with correct parameters', async () => {
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.ok(mockSessions));

      await useCase.execute({ agentBotId: 1, limit: 25 });

      expect(mockSessionRepository.fetchSessions).toHaveBeenCalledWith({
        agentBotId: 1,
        limit: 25,
      });
      expect(mockSessionRepository.fetchSessions).toHaveBeenCalledTimes(1);
    });

    it('should return sessions on success', async () => {
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.ok(mockSessions));

      const result = await useCase.execute({ agentBotId: 1 });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(mockSessions);
    });

    it('should return empty array when no sessions exist', async () => {
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.ok([]));

      const result = await useCase.execute({ agentBotId: 99 });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should pass through optional parameters', async () => {
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.ok(mockSessions));

      await useCase.execute({ agentBotId: 1, limit: 50, offset: 10 });

      expect(mockSessionRepository.fetchSessions).toHaveBeenCalledWith({
        agentBotId: 1,
        limit: 50,
        offset: 10,
      });
    });

    it('should handle sessions with different agent bot IDs', async () => {
      const sessionsForBot2: AIChatSession[] = [
        {
          id: createAIChatSessionId('session-bot2'),
          agentBotId: 2,
          accountId: 123,
          createdAt: new Date('2024-01-15T12:00:00Z'),
          updatedAt: new Date('2024-01-15T12:30:00Z'),
        },
      ];
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.ok(sessionsForBot2));

      const result = await useCase.execute({ agentBotId: 2 });

      expect(result.getValue()[0].agentBotId).toBe(2);
    });
  });

  // ============================================================================
  // Failure Execution Tests
  // ============================================================================

  describe('failure execution', () => {
    it('should return failure when repository fails', async () => {
      const error = new Error('Network error');
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ agentBotId: 1 });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should propagate repository error message', async () => {
      const error = new Error('Session fetch failed');
      mockSessionRepository.fetchSessions.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ agentBotId: 1 });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('Session fetch failed');
    });

    it('should handle rejected promise from repository', async () => {
      const error = new Error('Unexpected error');
      mockSessionRepository.fetchSessions.mockRejectedValue(error);

      await expect(useCase.execute({ agentBotId: 1 })).rejects.toThrow('Unexpected error');
    });
  });
});
