/**
 * Unit Tests for CreateAIChatSessionUseCase
 *
 * Tests the use case that creates a new chat session with a specific bot.
 */

import 'reflect-metadata';

// Mock the dependency-injection module to prevent import chain issues
jest.mock('@/dependency-injection', () => ({
  AI_ASSISTANT_TOKENS: {
    IAIChatSessionRepository: Symbol('IAIChatSessionRepository'),
  },
}));

import { CreateAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/CreateAIChatSessionUseCase';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';
import { Result } from '@/domain/shared/Result';
import { createAIChatSessionId } from '@/domain/value-objects/ai-assistant';

describe('CreateAIChatSessionUseCase', () => {
  let useCase: CreateAIChatSessionUseCase;
  let mockSessionRepository: jest.Mocked<IAIChatSessionRepository>;

  // Sample session data for tests
  const mockCreatedSession: AIChatSession = {
    id: createAIChatSessionId('new-session-123'),
    agentBotId: 1,
    accountId: 123,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionRepository = {
      fetchSessions: jest.fn(),
      fetchMessages: jest.fn(),
      createSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
    };

    useCase = new CreateAIChatSessionUseCase(mockSessionRepository);
  });

  // ============================================================================
  // Successful Execution Tests
  // ============================================================================

  describe('successful execution', () => {
    it('should call repository with correct parameters', async () => {
      mockSessionRepository.createSession.mockResolvedValue(Result.ok(mockCreatedSession));

      await useCase.execute({ agentBotId: 1 });

      expect(mockSessionRepository.createSession).toHaveBeenCalledWith({ agentBotId: 1 });
      expect(mockSessionRepository.createSession).toHaveBeenCalledTimes(1);
    });

    it('should return created session on success', async () => {
      mockSessionRepository.createSession.mockResolvedValue(Result.ok(mockCreatedSession));

      const result = await useCase.execute({ agentBotId: 1 });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(mockCreatedSession);
    });

    it('should pass initialMessage to repository when provided', async () => {
      mockSessionRepository.createSession.mockResolvedValue(Result.ok(mockCreatedSession));

      await useCase.execute({ agentBotId: 1, initialMessage: 'Hello bot!' });

      expect(mockSessionRepository.createSession).toHaveBeenCalledWith({
        agentBotId: 1,
        initialMessage: 'Hello bot!',
      });
    });

    it('should return session with correct agentBotId', async () => {
      const sessionWithBot5: AIChatSession = {
        ...mockCreatedSession,
        agentBotId: 5,
      };
      mockSessionRepository.createSession.mockResolvedValue(Result.ok(sessionWithBot5));

      const result = await useCase.execute({ agentBotId: 5 });

      expect(result.getValue().agentBotId).toBe(5);
    });

    it('should return session with generated ID', async () => {
      mockSessionRepository.createSession.mockResolvedValue(Result.ok(mockCreatedSession));

      const result = await useCase.execute({ agentBotId: 1 });

      expect(result.getValue().id).toBe('new-session-123');
    });
  });

  // ============================================================================
  // Failure Execution Tests
  // ============================================================================

  describe('failure execution', () => {
    it('should return failure when repository fails', async () => {
      const error = new Error('Failed to create session');
      mockSessionRepository.createSession.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ agentBotId: 1 });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should propagate repository error message', async () => {
      const error = new Error('Bot not found');
      mockSessionRepository.createSession.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ agentBotId: 999 });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('Bot not found');
    });

    it('should handle rejected promise from repository', async () => {
      const error = new Error('Unexpected error');
      mockSessionRepository.createSession.mockRejectedValue(error);

      await expect(useCase.execute({ agentBotId: 1 })).rejects.toThrow('Unexpected error');
    });
  });
});
