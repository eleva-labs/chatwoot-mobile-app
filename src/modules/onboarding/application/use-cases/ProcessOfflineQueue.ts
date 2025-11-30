import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import { OfflineQueue, QueuedSubmission } from '../../infrastructure/queue/OfflineQueue';
import { Result } from '../../domain/entities/Result';
import { NetworkError } from '../../domain/entities/Errors';
import { logger } from '../../shared/utils/logger';

/**
 * Process Offline Queue Use Case
 *
 * Processes queued submissions when the device comes online.
 */
export class ProcessOfflineQueueUseCase {
  constructor(
    private readonly onboardingRepository: IOnboardingRepository,
    private readonly offlineQueue: OfflineQueue,
  ) {}

  /**
   * Process all queued submissions
   */
  async execute(): Promise<Result<number, Error>> {
    try {
      const queueResult: Result<QueuedSubmission[], Error> = await this.offlineQueue.getQueue();
      if (queueResult.isFailure) {
        return Result.fail(queueResult.getError());
      }

      const queue: QueuedSubmission[] = queueResult.getValue() || [];
      if (queue.length === 0) {
        return Result.ok(0);
      }

      let processedCount = 0;
      const failedItems: typeof queue = [];

      // Process each item in the queue
      for (const item of queue) {
        const submitResult: Result<void, Error> = await this.onboardingRepository.submitAnswers(
          item.flowId,
          item.answers,
        );

        if (submitResult.isSuccess) {
          // Successfully submitted, remove from queue
          await this.offlineQueue.dequeue(item);
          processedCount++;
          logger.info(`Processed queued submission for flow: ${item.flowId}`);
        } else {
          // Failed to submit
          const error: Error = submitResult.getError();

          // If it's a network error, increment retry count
          if (error instanceof NetworkError) {
            await this.offlineQueue.incrementRetry(item);
            failedItems.push(item);
            logger.warn(
              `Failed to process queued submission (retry ${item.retryCount + 1}/${this.offlineQueue['MAX_RETRIES']}): ${error.message}`,
            );
          } else {
            // Non-network error, remove from queue (won't succeed on retry)
            await this.offlineQueue.dequeue(item);
            logger.error(`Removed queued submission due to non-network error: ${error.message}`);
          }
        }
      }

      return Result.ok(processedCount);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Failed to process offline queue'),
      );
    }
  }

  /**
   * Check if there are items in the queue
   */
  async hasPendingItems(): Promise<Result<boolean, Error>> {
    const sizeResult: Result<number, Error> = await this.offlineQueue.size();
    if (sizeResult.isFailure) {
      return Result.fail(sizeResult.getError());
    }

    return Result.ok(sizeResult.getValue() > 0);
  }
}
