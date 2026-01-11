/**
 * Unit Tests for DeleteAIChatSessionUseCase
 *
 * Tests the use case that deletes a specific chat session.
 */

import 'reflect-metadata';

// Mock the dependency-injection module to prevent import chain issues
jest.mock('@/dependency-injection', () => ({
  AI_ASSISTANT_TOKENS: {
    IAIChatSessionRepository: Symbol('IAIChatSessionRepository'),
  },
}));

import { DeleteAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/DeleteAIChatSessionUseCase';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import { Result } from '@/domain/shared/Result';
import { createAIChatSessionId } from '@/domain/value-objects/ai-assistant';

describe('DeleteAIChatSessionUseCase', () => {
  let useCase: DeleteAIChatSessionUseCase;
  let mockSessionRepository: jest.Mocked<IAIChatSessionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionRepository = {
      fetchSessions: jest.fn(),
      fetchMessages: jest.fn(),
      createSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
    };

    useCase = new DeleteAIChatSessionUseCase(mockSessionRepository);
  });

  // ============================================================================
  // Successful Execution Tests
  // ============================================================================

  describe('successful execution', () => {
    it('should call repository with correct session ID', async () => {
      const sessionId = createAIChatSessionId('session-to-delete');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.ok(undefined));

      await useCase.execute({ chatSessionId: sessionId });

      expect(mockSessionRepository.deleteSession).toHaveBeenCalledWith(sessionId);
      expect(mockSessionRepository.deleteSession).toHaveBeenCalledTimes(1);
    });

    it('should return success on successful deletion', async () => {
      const sessionId = createAIChatSessionId('session-123');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({ chatSessionId: sessionId });

      expect(result.isSuccess).toBe(true);
    });

    it('should return void/undefined value on success', async () => {
      const sessionId = createAIChatSessionId('session-456');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({ chatSessionId: sessionId });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
    });

    it('should handle different session IDs correctly', async () => {
      const sessionId1 = createAIChatSessionId('session-a');
      const sessionId2 = createAIChatSessionId('session-b');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.ok(undefined));

      await useCase.execute({ chatSessionId: sessionId1 });
      await useCase.execute({ chatSessionId: sessionId2 });

      expect(mockSessionRepository.deleteSession).toHaveBeenNthCalledWith(1, sessionId1);
      expect(mockSessionRepository.deleteSession).toHaveBeenNthCalledWith(2, sessionId2);
    });
  });

  // ============================================================================
  // Failure Execution Tests
  // ============================================================================

  describe('failure execution', () => {
    it('should return failure when repository fails', async () => {
      const sessionId = createAIChatSessionId('session-fail');
      const error = new Error('Session not found');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ chatSessionId: sessionId });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should propagate repository error message', async () => {
      const sessionId = createAIChatSessionId('session-error');
      const error = new Error('Permission denied');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ chatSessionId: sessionId });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('Permission denied');
    });

    it('should handle rejected promise from repository', async () => {
      const sessionId = createAIChatSessionId('session-reject');
      const error = new Error('Network timeout');
      mockSessionRepository.deleteSession.mockRejectedValue(error);

      await expect(useCase.execute({ chatSessionId: sessionId })).rejects.toThrow(
        'Network timeout',
      );
    });

    it('should return failure for non-existent session', async () => {
      const sessionId = createAIChatSessionId('non-existent');
      const error = new Error('Session does not exist');
      mockSessionRepository.deleteSession.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({ chatSessionId: sessionId });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('Session does not exist');
    });
  });
});
