/**
 * Tests for SubmitOnboardingAnswersUseCaseImpl
 *
 * Tests the use case that orchestrates submitting answers to the server.
 */

import { SubmitOnboardingAnswersUseCaseImpl } from '../../../application/use-cases/SubmitOnboardingAnswersUseCaseImpl';
import { createMockOnboardingRepository, createMockStorageRepository } from '../../helpers/mocks';
import { OfflineQueueRepository } from '../../../infrastructure/repositories/OfflineQueueRepository';
import type { IOfflineQueueRepository } from '../../../domain/repositories/IOfflineQueueRepository';
import { NetworkError } from '../../../domain/entities/Errors';
import { Result } from '../../../domain/entities/Result';

describe('SubmitOnboardingAnswersUseCaseImpl', () => {
  let useCase: SubmitOnboardingAnswersUseCaseImpl;
  let mockOnboardingRepo: ReturnType<typeof createMockOnboardingRepository>;
  let mockStorageRepo: ReturnType<typeof createMockStorageRepository>;
  let offlineQueue: IOfflineQueueRepository | undefined;

  beforeEach(() => {
    mockOnboardingRepo = createMockOnboardingRepository();
    mockStorageRepo = createMockStorageRepository();
    offlineQueue = new OfflineQueueRepository(mockStorageRepo);
    useCase = new SubmitOnboardingAnswersUseCaseImpl(mockOnboardingRepo, offlineQueue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should submit answers successfully', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      mockOnboardingRepo.setSubmitError(null); // Default success

      const result = await useCase.execute(flowId, answers);

      expect(result.isSuccess).toBe(true);
      expect(mockOnboardingRepo.submitAnswersCallCount).toBe(1);
    });

    it('should queue answers when network error occurs and offline queue is available', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Mock network error
      const networkError = new NetworkError('Network error');
      mockOnboardingRepo.setSubmitError(networkError);

      const result = await useCase.execute(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('No internet connection');

      // Verify answers were queued
      const queueResult = await offlineQueue!.getQueue();
      expect(queueResult.getValue()).toHaveLength(1);
      expect(queueResult.getValue()?.[0].flowId).toBe(flowId);
    });

    it('should return error when queueing fails after network error', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Mock network error
      const networkError = new NetworkError('Network error');
      mockOnboardingRepo.setSubmitError(networkError);

      // Make queue enqueue fail
      mockStorageRepo.setSaveError(new Error('Storage error'));

      const result = await useCase.execute(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('Failed to submit answers');
    });

    it('should return error when network error occurs but offline queue is not available', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Create use case without offline queue
      const useCaseWithoutQueue = new SubmitOnboardingAnswersUseCaseImpl(mockOnboardingRepo);

      // Mock network error
      const networkError = new NetworkError('Network error');
      mockOnboardingRepo.setSubmitError(networkError);

      const result = await useCaseWithoutQueue.execute(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('Failed to submit answers');
    });

    it('should return non-network errors directly', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Mock non-network error
      const error = new Error('Validation error');
      mockOnboardingRepo.setSubmitError(error);

      const result = await useCase.execute(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toBe('Validation error');

      // Should not queue non-network errors
      const queueResult = await offlineQueue!.getQueue();
      expect(queueResult.getValue()).toHaveLength(0);
    });

    it('should handle exceptions during submission', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Make submitAnswers throw an exception
      jest.spyOn(mockOnboardingRepo, 'submitAnswers').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await useCase.execute(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
      // When an Error is thrown, it's wrapped in a new Error
      expect(result.getError().message).toBe('Unexpected error');
    });

    it('should handle non-Error exceptions', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Make submitAnswers throw a non-Error
      jest.spyOn(mockOnboardingRepo, 'submitAnswers').mockImplementation(() => {
        throw 'String error';
      });

      const result = await useCase.execute(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toBe('Failed to submit onboarding answers');
    });
  });
});
