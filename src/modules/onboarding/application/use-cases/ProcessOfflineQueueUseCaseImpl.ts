import { injectable, inject } from 'tsyringe';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import type {
  IOfflineQueueRepository,
  QueuedSubmission,
} from '../../domain/repositories/IOfflineQueueRepository';
import { Result } from '../../domain/entities/Result';
import { NetworkError } from '../../domain/entities/Errors';
import { logger } from '../../shared/utils/logger';
import { DI_TOKENS } from '../../dependency_injection/tokens';
import type { IProcessOfflineQueueUseCase } from '../../domain/use-cases/IProcessOfflineQueueUseCase';

/**
 * Process Offline Queue Use Case
 *
 * Processes queued submissions when the device comes online.
 */
@injectable()
export class ProcessOfflineQueueUseCaseImpl implements IProcessOfflineQueueUseCase {
  constructor(
    @inject(DI_TOKENS.IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
    @inject(DI_TOKENS.IOfflineQueueRepository)
    private readonly offlineQueue: IOfflineQueueRepository,
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
              `Failed to process queued submission (retry ${item.retryCount + 1}): ${error.message}`,
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
