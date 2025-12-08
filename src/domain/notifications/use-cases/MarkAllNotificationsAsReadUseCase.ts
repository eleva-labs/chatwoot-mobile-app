import type { INotificationRepository } from '../interfaces/INotificationRepository';

/**
 * Domain Layer: Mark All Notifications As Read Use Case
 * 
 * Business logic for marking all notifications as read.
 * 
 * This use case:
 * - Coordinates with repository to update all notifications
 * - No additional business rules (simple operation)
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class MarkAllNotificationsAsReadUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the mark all as read use case
   * 
   * @returns Promise that resolves when operation completes
   * @throws Error if repository operation fails
   */
  async execute(): Promise<void> {
    // Execute repository operation
    // Repository handles: API call + Redux dispatch (Infrastructure concerns)
    await this.repository.markAllAsRead();
  }
}

