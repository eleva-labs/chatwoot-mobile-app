import type { INotificationRepository, NotificationListParams, NotificationListResult } from '../interfaces/INotificationRepository';

/**
 * Domain Layer: Fetch Notifications Use Case
 * 
 * Business logic for fetching notifications.
 * 
 * This use case:
 * - Validates input parameters
 * - Coordinates with repository to fetch data
 * - Returns domain entities
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class FetchNotificationsUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the fetch notifications use case
   * 
   * @param params - Pagination and sorting parameters
   * @returns List of notifications with metadata
   * @throws Error if validation fails or repository operation fails
   */
  async execute(params: NotificationListParams): Promise<NotificationListResult> {
    // Validate input
    if (params.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (!['asc', 'desc'].includes(params.sortOrder)) {
      throw new Error('Sort order must be "asc" or "desc"');
    }

    // Execute repository operation
    // Repository handles: API call + Redux dispatch (Infrastructure concerns)
    return await this.repository.getAll(params);
  }
}

