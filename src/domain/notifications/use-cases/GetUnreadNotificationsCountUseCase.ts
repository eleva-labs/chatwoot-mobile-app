import type { INotificationRepository } from '../interfaces/INotificationRepository';

/**
 * Domain Layer: Get Unread Notifications Count Use Case
 * 
 * Business logic for getting the unread notification count.
 * 
 * This use case:
 * - Reads from store (via repository)
 * - Returns count for business logic or UI display
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class GetUnreadNotificationsCountUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the get unread count use case
   * 
   * @returns Current unread notification count
   */
  execute(): number {
    // Read from store via repository
    // Repository abstracts Redux (Infrastructure concern)
    return this.repository.getUnreadCount();
  }
}

