import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type {
  NotificationCreatedResponse,
  NotificationResponse,
  NotificationRemovedResponse,
  MarkAsReadPayload,
} from './notificationTypes';
// Using domain entity type for new operations
// Keeping @/types/Notification for backward compatibility with existing code
import type { Notification } from '@/domain/notifications/entities/Notification';
import { notificationActions } from './notificationAction';
import { updateBadgeCount } from '@/utils/pushUtils';

export interface NotificationState {
  unreadCount: number;
  totalCount: number;
  currentPage: string;
  error: string | null;
  uiFlags: {
    isLoading: boolean;
    isAllNotificationsRead: boolean;
    isAllNotificationsFetched: boolean;
  };
}

export const notificationsAdapter = createEntityAdapter<Notification>();

const initialState = notificationsAdapter.getInitialState<NotificationState>({
  unreadCount: 0,
  totalCount: 0,
  currentPage: '1',
  error: null,
  uiFlags: {
    isLoading: false,
    isAllNotificationsRead: false,
    isAllNotificationsFetched: false,
  },
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: state => {
      notificationsAdapter.removeAll(state);
      state.unreadCount = 0;
      state.totalCount = 0;
      state.currentPage = '1';
      state.error = null;
    },
    addNotification(state, action: PayloadAction<NotificationCreatedResponse>) {
      const { notification, unreadCount } = action.payload;
      notificationsAdapter.addOne(state, notification);
      state.unreadCount = unreadCount;
      updateBadgeCount({ count: unreadCount });
    },
    removeNotification(state, action: PayloadAction<NotificationRemovedResponse>) {
      const { notification, unreadCount } = action.payload;
      notificationsAdapter.removeOne(state, notification.id);
      state.unreadCount = unreadCount;
      updateBadgeCount({ count: unreadCount });
    },
    // Minimal operations following Clean Architecture pattern
    // Save operation: Add or update notifications in store
    addNotificationsToStore(state, action: PayloadAction<Notification[]>) {
      notificationsAdapter.upsertMany(state, action.payload);
    },
    // Delete operation: Remove notifications from store
    deleteNotificationsFromStore(state, action: PayloadAction<number[]>) {
      notificationsAdapter.removeMany(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      // Fetch notifications
      .addCase(notificationActions.fetchNotifications.pending, state => {
        state.uiFlags.isLoading = true;
        state.error = null;
      })
      .addCase(
        notificationActions.fetchNotifications.fulfilled,
        (state, action: PayloadAction<NotificationResponse>) => {
          const { meta, payload } = action.payload;
          // Update metadata and handle pagination logic
          // Repository dispatches addNotificationsToStore (upsertMany)
          // For page 1, we need to replace all (setAll) to handle refresh/reset scenarios
          // For subsequent pages, upsertMany from repository is sufficient
          if (meta.currentPage === '1') {
            // Page 1: Replace all notifications (handles refresh without reset)
            notificationsAdapter.setAll(state, payload);
          }
          // For page > 1, notifications are already added via repository's addNotificationsToStore

          // Update metadata
          state.unreadCount = meta.unreadCount;
          state.totalCount = meta.count;
          state.currentPage = meta.currentPage;
          state.uiFlags.isLoading = false;
          updateBadgeCount({ count: meta.unreadCount });
          state.uiFlags.isAllNotificationsFetched = payload.length <= 15;
        },
      )
      .addCase(notificationActions.fetchNotifications.rejected, (state, action) => {
        state.uiFlags.isLoading = false;
        state.uiFlags.isAllNotificationsRead = true;
        state.error = (action.payload as string) ?? 'Failed to fetch notifications';
      })
      .addCase(notificationActions.delete.fulfilled, (state, action: PayloadAction<number>) => {
        // Notification already removed by repository's optimistic update
        // This is idempotent - safe to call again if needed
        // Repository handles: store.dispatch(deleteNotificationsFromStore([notificationId]))
        // No additional action needed here, but keeping for backward compatibility
      })
      .addCase(
        notificationActions.markAsRead.fulfilled,
        (state, action: PayloadAction<MarkAsReadPayload>) => {
          const { primaryActorId } = action.payload;
          const notification = Object.values(state.entities).find(
            n => n?.primaryActorId === primaryActorId,
          );
          if (notification) {
            notificationsAdapter.updateOne(state, {
              id: notification.id,
              changes: { readAt: new Date().toISOString() },
            });
            state.unreadCount -= 1;
            updateBadgeCount({ count: state.unreadCount });
          }
        },
      )
      .addCase(notificationActions.markAllAsRead.fulfilled, state => {
        state.unreadCount = 0;
        // Iterate over all notifications and mark them as read
        Object.values(state.entities).forEach(notification => {
          if (notification) {
            notificationsAdapter.updateOne(state, {
              id: notification.id,
              changes: { readAt: new Date().toISOString() },
            });
          }
        });
        updateBadgeCount({ count: 0 });
      })
      .addCase(
        notificationActions.markAsUnread.fulfilled,
        (state, action: PayloadAction<number>) => {
          const notificationId = action.payload;
          notificationsAdapter.updateOne(state, {
            id: notificationId,
            changes: { readAt: undefined },
          });
          state.unreadCount += 1;
          updateBadgeCount({ count: state.unreadCount });
        },
      );
  },
});

export const {
  resetNotifications,
  addNotification,
  removeNotification,
  addNotificationsToStore,
  deleteNotificationsFromStore,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
