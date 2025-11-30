import { injectable, inject } from 'tsyringe';
import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { StorageError } from '../../domain/entities/Errors';
import { DI_TOKENS } from '../../di/tokens';

/**
 * Offline Queue Item
 */
export interface QueuedSubmission {
  flowId: string;
  answers: Answers;
  timestamp: number;
  retryCount: number;
}

/**
 * Offline Queue Manager
 *
 * Manages a queue of answers to be submitted when the device comes online.
 */
@injectable()
export class OfflineQueue {
  private readonly QUEUE_KEY = 'onboarding_offline_queue';
  private readonly MAX_RETRIES = 3;
  private enqueueLock: Promise<Result<void, Error>> = Promise.resolve(Result.ok(undefined));

  constructor(
    @inject(DI_TOKENS.IStorageRepository) private readonly storageRepository: IStorageRepository,
  ) {}

  /**
   * Add answers to the offline queue
   */
  async enqueue(flowId: string, answers: Answers): Promise<Result<void, Error>> {
    // Use a lock to prevent race conditions in concurrent enqueue operations
    const previousLock = this.enqueueLock;
    let resolveLock: (value: Result<void, Error>) => void;
    const newLock = new Promise<Result<void, Error>>(resolve => {
      resolveLock = resolve;
    });

    this.enqueueLock = previousLock.then(async (): Promise<Result<void, Error>> => {
      try {
        const queueResult: Result<QueuedSubmission[], Error> = await this.getQueue();
        if (queueResult.isFailure) {
          const result = Result.fail(queueResult.getError());
          resolveLock!(result);
          return result;
        }

        const queue: QueuedSubmission[] = queueResult.getValue() || [];
        const newItem: QueuedSubmission = {
          flowId,
          answers,
          timestamp: Date.now(),
          retryCount: 0,
        };

        queue.push(newItem);

        const result = await this.saveQueue(queue);
        resolveLock!(result);
        return result;
      } catch (error) {
        const result = Result.fail(
          error instanceof Error ? error : new StorageError('Failed to enqueue submission'),
        );
        resolveLock!(result);
        return result;
      }
    });

    return newLock;
  }

  /**
   * Get all queued submissions
   */
  async getQueue(): Promise<Result<QueuedSubmission[], Error>> {
    try {
      const result: Result<QueuedSubmission[] | null, Error> = await this.storageRepository.get<
        QueuedSubmission[]
      >(this.QUEUE_KEY);

      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue() || []);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new StorageError('Failed to get queue'));
    }
  }

  /**
   * Remove a specific item from the queue
   */
  async dequeue(item: QueuedSubmission): Promise<Result<void, Error>> {
    try {
      const queueResult = await this.getQueue();
      if (queueResult.isFailure) {
        return Result.fail(queueResult.getError());
      }

      const queue = queueResult.getValue() || [];
      const filtered = queue.filter(
        q =>
          !(
            q.flowId === item.flowId &&
            q.timestamp === item.timestamp &&
            JSON.stringify(q.answers) === JSON.stringify(item.answers)
          ),
      );

      return this.saveQueue(filtered);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to dequeue item'),
      );
    }
  }

  /**
   * Increment retry count for an item
   */
  async incrementRetry(item: QueuedSubmission): Promise<Result<void, Error>> {
    try {
      const queueResult = await this.getQueue();
      if (queueResult.isFailure) {
        return Result.fail(queueResult.getError());
      }

      const queue = queueResult.getValue() || [];
      const updated = queue.map(q => {
        if (
          q.flowId === item.flowId &&
          q.timestamp === item.timestamp &&
          JSON.stringify(q.answers) === JSON.stringify(item.answers)
        ) {
          return { ...q, retryCount: q.retryCount + 1 };
        }
        return q;
      });

      // Remove items that exceeded max retries
      const filtered = updated.filter(q => q.retryCount <= this.MAX_RETRIES);

      return this.saveQueue(filtered);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to increment retry'),
      );
    }
  }

  /**
   * Clear the entire queue
   */
  async clear(): Promise<Result<void, Error>> {
    try {
      return this.storageRepository.remove(this.QUEUE_KEY);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new StorageError('Failed to clear queue'),
      );
    }
  }

  /**
   * Get queue size
   */
  async size(): Promise<Result<number, Error>> {
    const queueResult: Result<QueuedSubmission[], Error> = await this.getQueue();
    if (queueResult.isFailure) {
      return Result.fail(queueResult.getError());
    }

    return Result.ok(queueResult.getValue()?.length || 0);
  }

  private async saveQueue(queue: QueuedSubmission[]): Promise<Result<void, Error>> {
    return this.storageRepository.save(this.QUEUE_KEY, queue);
  }
}
