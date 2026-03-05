import { Result } from '../entities/Result';
import type { Answers } from '../common';

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
 * Offline Queue Repository Interface (Port)
 *
 * Defines the contract for managing offline submission queues.
 * Manages a queue of answers to be submitted when the device comes online.
 */
export interface IOfflineQueueRepository {
  /**
   * Add answers to the offline queue
   */
  enqueue(flowId: string, answers: Answers): Promise<Result<void, Error>>;

  /**
   * Get all queued submissions
   */
  getQueue(): Promise<Result<QueuedSubmission[], Error>>;

  /**
   * Remove a specific item from the queue
   */
  dequeue(item: QueuedSubmission): Promise<Result<void, Error>>;

  /**
   * Increment retry count for an item
   */
  incrementRetry(item: QueuedSubmission): Promise<Result<void, Error>>;

  /**
   * Clear the entire queue
   */
  clear(): Promise<Result<void, Error>>;

  /**
   * Get queue size
   */
  size(): Promise<Result<number, Error>>;
}
