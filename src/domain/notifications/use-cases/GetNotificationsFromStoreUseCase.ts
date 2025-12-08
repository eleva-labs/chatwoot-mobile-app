import type { INotificationRepository } from '../interfaces/INotificationRepository';
import type { Notification } from '../entities/Notification';

/**
 * Domain Layer: Get Notifications From Store Use Case
 * 
 * Business logic for getting notifications from the store.
 * 
 * This use case:
 * - Reads from store (via repository)
 * - Returns notifications for business logic processing
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class GetNotificationsFromStoreUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the get from store use case
   * 
   * @returns Array of notifications currently in store
   */
  execute(): Notification[] {
    // Read from store via repository
    // Repository abstracts Redux (Infrastructure concern)
    return this.repository.getFromStore();
  }
}

