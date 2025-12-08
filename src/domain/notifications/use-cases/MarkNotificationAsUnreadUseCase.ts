import type { INotificationRepository } from '../interfaces/INotificationRepository';

/**
 * Domain Layer: Mark Notification As Unread Use Case
 * 
 * Business logic for marking a notification as unread.
 * 
 * This use case:
 * - Validates notification ID
 * - Coordinates with repository to update notification status
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class MarkNotificationAsUnreadUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the mark as unread use case
   * 
   * @param notificationId - Notification ID to mark as unread
   * @returns Promise that resolves when operation completes
   * @throws Error if validation fails or repository operation fails
   */
  async execute(notificationId: number): Promise<void> {
    // Validate input
    if (!notificationId || notificationId <= 0) {
      throw new Error('Notification ID must be a positive number');
    }

    // Execute repository operation
    // Repository handles: API call + Redux dispatch (Infrastructure concerns)
    await this.repository.markAsUnread(notificationId);
  }
}

