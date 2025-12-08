import type { INotificationRepository } from '../interfaces/INotificationRepository';

/**
 * Domain Layer: Delete Notification Use Case
 * 
 * Business logic for deleting a notification.
 * 
 * This use case:
 * - Validates notification ID
 * - Coordinates with repository to delete notification
 * - Handles business rules (e.g., permission checks, cascade deletes)
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class DeleteNotificationUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the delete notification use case
   * 
   * @param notificationId - Notification ID to delete
   * @returns Promise that resolves when operation completes
   * @throws Error if validation fails or repository operation fails
   */
  async execute(notificationId: number): Promise<void> {
    // Validate input
    if (!notificationId || notificationId <= 0) {
      throw new Error('Notification ID must be a positive number');
    }

    // Execute repository operation
    // Repository handles: Redux dispatch (optimistic) + API call (Infrastructure concerns)
    await this.repository.delete(notificationId);
  }
}

