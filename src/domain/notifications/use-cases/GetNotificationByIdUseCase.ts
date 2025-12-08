import type { INotificationRepository } from '../interfaces/INotificationRepository';
import type { Notification } from '../entities/Notification';

/**
 * Domain Layer: Get Notification By ID Use Case
 * 
 * Business logic for getting a notification by ID from the store.
 * 
 * This use case:
 * - Validates notification ID
 * - Reads from store (via repository)
 * - Returns notification if found
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class GetNotificationByIdUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the get by ID use case
   * 
   * @param id - Notification ID
   * @returns Notification if found, undefined otherwise
   * @throws Error if validation fails
   */
  execute(id: number): Notification | undefined {
    // Validate input
    if (!id || id <= 0) {
      throw new Error('Notification ID must be a positive number');
    }

    // Read from store via repository
    // Repository abstracts Redux (Infrastructure concern)
    return this.repository.getById(id);
  }
}

