import { store } from '@/store';
import type { RootState } from '@/store';
import type {
  INotificationRepository,
  NotificationListParams,
  NotificationListResult,
  MarkAsReadParams,
} from '@/domain/notifications/interfaces/INotificationRepository';
import type { Notification, NotificationMeta } from '@/domain/notifications/entities/Notification';
import { apiService } from '@/services/APIService';
import { NotificationMapper } from '@/infrastructure/mappers/notifications/notificationMapper';
import type {
  NotificationDTO,
  NotificationMetaDTO,
  NotificationAPIResponseDTO,
} from './dto/NotificationDTO';
import {
  selectAllNotifications,
  selectNotificationById,
  selectIsLoadingNotifications,
} from '@/store/notification/notificationSelectors';
import {
  addNotificationsToStore,
  deleteNotificationsFromStore,
} from '@/store/notification/notificationSlice';

/**
 * Infrastructure Layer: Notification Repository Implementation
 *
 * Implements INotificationRepository interface.
 *
 * Responsibilities:
 * - API communication (via APIService)
 * - Data transformation (API format → Domain entities)
 * - Redux dispatch (state management)
 * - Store read operations (via selectors)
 *
 * This repository coordinates between:
 * - Domain Layer (use cases call this)
 * - Infrastructure Layer (Redux, API client)
 */


export class NotificationRepository implements INotificationRepository {
  private readonly mapper = new NotificationMapper();

  /**
   * Fetch notifications from backend API
   *
   * Flow:
   * 1. Call API
   * 2. Transform response to domain entities
   * 3. Dispatch to Redux (Infrastructure)
   * 4. Return domain entities
   */
  async getAll(params: NotificationListParams): Promise<NotificationListResult> {
    // 1. API call (Infrastructure) - returns DTOs
    const response = await apiService.get<NotificationAPIResponseDTO>(
      `notifications?sort_order=${params.sortOrder}&includes[]=snoozed&includes[]=read&page=${params.page}`,
    );

    // 2. Map DTOs to Domain entities
    const { payload, meta } = response.data.data;
    const notifications: Notification[] = payload.map((dto: NotificationDTO) =>
      this.mapper.mapNotificationFromDTO(dto),
    );
    const notificationMeta: NotificationMeta = this.mapper.mapNotificationMetaFromDTO(meta);

    // 3. Dispatch to Redux (Infrastructure concern)
    // For page 1, we replace all notifications (handled by extraReducer with setAll)
    // For subsequent pages, we append (upsertMany)
    // Repository always uses upsertMany - extraReducer handles page 1 replacement
    store.dispatch(addNotificationsToStore(notifications));

    // 4. Return domain entities
    return {
      notifications,
      meta: notificationMeta,
    };
  }

  /**
   * Mark all notifications as read
   *
   * Flow:
   * 1. Call API
   * 2. Redux update handled by Action Cable or separate update
   */
  async markAllAsRead(): Promise<void> {
    await apiService.post(`notifications/read_all`);
    // Redux update handled by Action Cable real-time event
  }

  /**
   * Mark notifications as read for a specific conversation
   *
   * Flow:
   * 1. Call API
   * 2. Redux update handled by Action Cable or separate update
   */
  async markAsRead(params: MarkAsReadParams): Promise<void> {
    await apiService.post(`notifications/read_all`, {
      primary_actor_id: params.primaryActorId,
      primary_actor_type: params.primaryActorType,
    });
    // Redux update handled by Action Cable real-time event
  }

  /**
   * Mark a notification as unread
   *
   * Flow:
   * 1. Call API
   * 2. Redux update handled by Action Cable or separate update
   */
  async markAsUnread(notificationId: number): Promise<void> {
    await apiService.post(`notifications/${notificationId}/unread`);
    // Redux update handled by Action Cable real-time event
  }

  /**
   * Delete a notification
   *
   * Flow:
   * 1. Optimistic update: Remove from Redux first
   * 2. Call API to delete from backend
   *
   * This follows the pattern: Update store → API call
   * This prevents front-end and back-end from being out of sync
   */
  async delete(notificationId: number): Promise<void> {
    // 1. Optimistic update: Remove from Redux first
    store.dispatch(deleteNotificationsFromStore([notificationId]));

    // 2. Delete from backend
    await apiService.delete(`notifications/${notificationId}`);
  }

  /**
   * Read operations from Redux store (Infrastructure)
   * These methods abstract Redux from the Domain layer
   */

  /**
   * Get all notifications from store
   */
  getFromStore(): Notification[] {
    const state = store.getState() as RootState;
    return selectAllNotifications(state);
  }

  /**
   * Get a notification by ID from store
   */
  getById(id: number): Notification | undefined {
    const state = store.getState() as RootState;
    return selectNotificationById(state, id);
  }

  /**
   * Get unread notification count from store
   */
  getUnreadCount(): number {
    const state = store.getState() as RootState;
    return state.notifications.unreadCount;
  }

  /**
   * Check if notifications are currently loading
   */
  isLoading(): boolean {
    const state = store.getState() as RootState;
    return selectIsLoadingNotifications(state);
  }
}

