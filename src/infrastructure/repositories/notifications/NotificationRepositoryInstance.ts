import { NotificationRepository } from './NotificationRepository';

/**
 * Infrastructure Layer: Notification Repository Instance
 *
 * Singleton instance of NotificationRepository for dependency injection.
 * This allows use cases to receive the repository without creating new instances.
 *
 * In a more advanced setup, this could be managed by a DI container.
 */
export const notificationRepository = new NotificationRepository();

