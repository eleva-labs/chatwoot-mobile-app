import type {
  INotificationRepository,
  MarkAsReadParams,
} from '../interfaces/INotificationRepository';

/**
 * Domain Layer: Mark Notification As Read Use Case
 * 
 * Business logic for marking notifications as read.
 * 
 * This use case:
 * - Validates input parameters
 * - Coordinates with repository to update notification status
 * - Handles business rules (e.g., conversation-specific marking)
 * 
 * Framework-independent: No knowledge of Redux, API, etc.
 */
export class MarkNotificationAsReadUseCase {
  constructor(private repository: INotificationRepository) {}

  /**
   * Execute the mark as read use case
   * 
   * @param params - Notification identifier (conversation-based)
   * @returns Promise that resolves when operation completes
   * @throws Error if validation fails or repository operation fails
   */
  async execute(params: MarkAsReadParams): Promise<void> {
    // Validate input
    if (!params.primaryActorId || params.primaryActorId <= 0) {
      throw new Error('Primary actor ID must be a positive number');
    }

    if (!['Conversation', 'Message'].includes(params.primaryActorType)) {
      throw new Error('Primary actor type must be "Conversation" or "Message"');
    }

    // Execute repository operation
    // Repository handles: API call + Redux dispatch (Infrastructure concerns)
    await this.repository.markAsRead(params);
  }
}

