import { Result } from '../entities/Result';

/**
 * Process Offline Queue Use Case Interface
 *
 * Processes queued submissions when the device comes online.
 */
export interface IProcessOfflineQueueUseCase {
  /**
   * Process all queued submissions
   */
  execute(): Promise<Result<number, Error>>;

  /**
   * Check if there are items in the queue
   */
  hasPendingItems(): Promise<Result<boolean, Error>>;
}
