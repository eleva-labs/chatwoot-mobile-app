/**
 * Tests for ProcessOfflineQueueUseCaseImpl
 *
 * This use case processes queued submissions when the device comes online.
 */

import { ProcessOfflineQueueUseCaseImpl } from '../../../application/use-cases/ProcessOfflineQueueUseCaseImpl';
import { createMockOnboardingRepository, createMockStorageRepository } from '../../helpers/mocks';
import { OfflineQueue } from '../../../infrastructure/queue/OfflineQueue';
import { NetworkError } from '../../../domain/entities/Errors';
import { Result } from '../../../domain/entities/Result';

describe('ProcessOfflineQueueUseCaseImpl', () => {
  let useCase: ProcessOfflineQueueUseCaseImpl;
  let mockOnboardingRepo: ReturnType<typeof createMockOnboardingRepository>;
  let mockStorageRepo: ReturnType<typeof createMockStorageRepository>;
  let offlineQueue: OfflineQueue;

  beforeEach(() => {
    mockOnboardingRepo = createMockOnboardingRepository();
    mockStorageRepo = createMockStorageRepository();
    offlineQueue = new OfflineQueue(mockStorageRepo);
    useCase = new ProcessOfflineQueueUseCaseImpl(mockOnboardingRepo, offlineQueue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should return 0 when queue is empty', async () => {
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(0);
    });

    it('should return failure when queue.getQueue() fails', async () => {
      mockStorageRepo.setGetError(new Error('Storage error'));

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });

    it('should process single queued submission successfully', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Enqueue a submission
      await offlineQueue.enqueue(flowId, answers);

      // Mock successful submission (default behavior)

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(1);
      expect(mockOnboardingRepo.submitAnswersCallCount).toBe(1);

      // Verify item was removed from queue
      const queueResult = await offlineQueue.getQueue();
      expect(queueResult.getValue()).toHaveLength(0);
    });

    it('should process multiple queued submissions successfully', async () => {
      // Enqueue multiple submissions
      await offlineQueue.enqueue('flow-1', { q1: 'answer1' });
      await offlineQueue.enqueue('flow-2', { q2: 'answer2' });
      await offlineQueue.enqueue('flow-3', { q3: 'answer3' });

      // Mock successful submissions (default behavior)

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(3);
      expect(mockOnboardingRepo.submitAnswersCallCount).toBe(3);

      // Verify queue is empty
      const queueResult = await offlineQueue.getQueue();
      expect(queueResult.getValue()).toHaveLength(0);
    });

    it('should increment retry count for network errors', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      await offlineQueue.enqueue(flowId, answers);

      // Mock network error
      const networkError = new NetworkError('Network error');
      mockOnboardingRepo.setSubmitError(networkError);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(0); // No items processed

      // Verify item is still in queue with incremented retry count
      const queueResult = await offlineQueue.getQueue();
      const queue = queueResult.getValue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });

    it('should remove item from queue for non-network errors', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      await offlineQueue.enqueue(flowId, answers);

      // Mock non-network error
      const error = new Error('Validation error');
      mockOnboardingRepo.setSubmitError(error);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(0);

      // Verify item was removed from queue
      const queueResult = await offlineQueue.getQueue();
      expect(queueResult.getValue()).toHaveLength(0);
    });

    it('should handle mix of successful and failed submissions', async () => {
      await offlineQueue.enqueue('flow-1', { q1: 'answer1' });
      await offlineQueue.enqueue('flow-2', { q2: 'answer2' });
      await offlineQueue.enqueue('flow-3', { q3: 'answer3' });

      // Mock: first succeeds, second network error, third succeeds
      let callCount = 0;
      jest.spyOn(mockOnboardingRepo, 'submitAnswers').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return Result.ok(undefined);
        if (callCount === 2) return Result.fail(new NetworkError('Network error'));
        return Result.ok(undefined);
      });

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(2); // 2 processed successfully

      // Verify queue has 1 item (the one with network error)
      const queueResult = await offlineQueue.getQueue();
      const queue = queueResult.getValue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });

    it('should handle max retries exceeded', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      await offlineQueue.enqueue(flowId, answers);

      // Increment retry count to max (3 retries = retryCount 3, which exceeds MAX_RETRIES of 3)
      const queueResult = await offlineQueue.getQueue();
      const queue = queueResult.getValue();
      if (queue && queue.length > 0) {
        const item = queue[0];
        // Increment retry 3 times to reach max
        await offlineQueue.incrementRetry(item);
        await offlineQueue.incrementRetry(item);
        await offlineQueue.incrementRetry(item);
      }

      // Mock network error
      mockOnboardingRepo.setSubmitError(new NetworkError('Network error'));

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(0);

      // Item should be removed after max retries (incrementRetry filters out items exceeding max)
      const finalQueueResult = await offlineQueue.getQueue();
      const finalQueue = finalQueueResult.getValue();
      expect(finalQueue.length).toBe(0);
    });

    it('should handle exception during processing', async () => {
      await offlineQueue.enqueue('flow-1', { q1: 'answer1' });

      // Make submitAnswers throw an exception
      jest.spyOn(mockOnboardingRepo, 'submitAnswers').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });
  });

  describe('hasPendingItems()', () => {
    it('should return false when queue is empty', async () => {
      const result = await useCase.hasPendingItems();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(false);
    });

    it('should return true when queue has items', async () => {
      await offlineQueue.enqueue('flow-1', { q1: 'answer1' });

      const result = await useCase.hasPendingItems();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should return failure when queue.size() fails', async () => {
      mockStorageRepo.setGetError(new Error('Storage error'));

      const result = await useCase.hasPendingItems();

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });
  });
});
