import type {
  Notification,
  NotificationMeta,
} from '../entities/Notification';

/**
 * Domain Layer: Notification Repository Interface
 * 
 * Defines the contract for notification data access.
 * Implementations exist in the Data Layer.
 * 
 * This interface abstracts the data source, allowing:
 * - Easy testing (mock implementations)
 * - Swapping data sources (API, local storage, etc.)
 * - Framework independence (Domain doesn't know about Redux, API, etc.)
 */

export interface NotificationListParams {
  page: number;
  sortOrder: 'asc' | 'desc';
}

export interface NotificationListResult {
  notifications: Notification[];
  meta: NotificationMeta;
}

export interface MarkAsReadParams {
  primaryActorId: number;
  primaryActorType: 'Conversation' | 'Message';
}

/**
 * Notification Repository Interface
 * 
 * Defines all operations for notification data access.
 * Write operations return data for potential Redux dispatch (handled by implementation).
 * Read operations return data from the store (Redux in Infrastructure).
 */
export interface INotificationRepository {
  /**
   * Fetch notifications from the backend API
   * 
   * @param params - Pagination and sorting parameters
   * @returns List of notifications with metadata
   */
  getAll(params: NotificationListParams): Promise<NotificationListResult>;

  /**
   * Mark all notifications as read
   * 
   * @returns Promise that resolves when operation completes
   */
  markAllAsRead(): Promise<void>;

  /**
   * Mark notifications as read for a specific conversation
   * 
   * @param params - Conversation identifier
   * @returns Promise that resolves when operation completes
   */
  markAsRead(params: MarkAsReadParams): Promise<void>;

  /**
   * Mark a notification as unread
   * 
   * @param notificationId - Notification ID to mark as unread
   * @returns Promise that resolves when operation completes
   */
  markAsUnread(notificationId: number): Promise<void>;

  /**
   * Delete a notification
   * 
   * @param notificationId - Notification ID to delete
   * @returns Promise that resolves when operation completes
   */
  delete(notificationId: number): Promise<void>;

  /**
   * Read operations from store (Redux)
   * These methods read from the state management system (Infrastructure)
   */

  /**
   * Get all notifications from store
   * 
   * @returns Array of notifications currently in store
   */
  getFromStore(): Notification[];

  /**
   * Get a notification by ID from store
   * 
   * @param id - Notification ID
   * @returns Notification if found, undefined otherwise
   */
  getById(id: number): Notification | undefined;

  /**
   * Get unread notification count from store
   * 
   * @returns Current unread count
   */
  getUnreadCount(): number;

  /**
   * Check if notifications are currently loading
   * 
   * @returns True if loading, false otherwise
   */
  isLoading(): boolean;
}

