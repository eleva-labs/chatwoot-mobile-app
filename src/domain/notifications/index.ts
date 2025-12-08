/**
 * Domain Layer: Notifications Module
 * 
 * Exports all domain components for notifications:
 * - Entities (Notification, NotificationType, etc.)
 * - Interfaces (INotificationRepository)
 * - Use Cases (FetchNotificationsUseCase, etc.)
 * - Constants
 */

// Entities
export type {
  Notification,
  NotificationType,
  PrimaryActorType,
  PrimaryActor,
  NotificationMeta,
} from './entities';

// Interfaces
export type {
  INotificationRepository,
  NotificationListParams,
  NotificationListResult,
  MarkAsReadParams,
} from './interfaces';

// Use Cases
export {
  FetchNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllNotificationsAsReadUseCase,
  MarkNotificationAsUnreadUseCase,
  DeleteNotificationUseCase,
  GetUnreadNotificationsCountUseCase,
  GetNotificationsFromStoreUseCase,
  GetNotificationByIdUseCase,
} from './use-cases';

// Constants
export { NOTIFICATION_TYPES, INBOX_SORT_OPTIONS } from './constants';
export type { InboxSortType } from './constants';

// Re-export NotificationType from entities (for convenience)
export type { NotificationType } from './entities';

