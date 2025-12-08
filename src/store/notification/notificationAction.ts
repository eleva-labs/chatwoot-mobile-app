import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import type {
  NotificationResponse,
  MarkAsReadPayload,
  ApiErrorResponse,
  InboxSortTypes,
} from './notificationTypes';
import { notificationRepository } from '@/infrastructure/repositories/notifications';
import {
  FetchNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllNotificationsAsReadUseCase,
  MarkNotificationAsUnreadUseCase,
  DeleteNotificationUseCase,
} from '@/domain/notifications/use-cases';

/**
 * Presentation Layer: Notification Async Thunks
 *
 * Thin coordinators that call use cases (Domain layer).
 * These thunks handle Redux-specific concerns (loading, errors)
 * but delegate business logic to use cases.
 *
 * Following Clean Architecture:
 * - Async thunks are thin coordinators
 * - Use cases contain business logic
 * - Repository handles API + Redux dispatch
 */

export const notificationActions = {
  fetchNotifications: createAsyncThunk<
    NotificationResponse,
    { page: number; sort_order: InboxSortTypes }
  >('notifications/fetchNotifications', async (payload, { rejectWithValue }) => {
    try {
      // Use Case executes business logic (Domain layer)
      const useCase = new FetchNotificationsUseCase(notificationRepository);
      const result = await useCase.execute({
        page: payload.page,
        sortOrder: payload.sort_order,
      });

      // Transform domain result to Redux format (for backward compatibility)
      return {
        meta: result.meta,
        payload: result.notifications,
      };
    } catch (error) {
      const { response } = error as AxiosError<ApiErrorResponse>;
      if (!response) {
        throw error;
      }
      return rejectWithValue(response.data);
    }
  }),

  markAsRead: createAsyncThunk<MarkAsReadPayload, MarkAsReadPayload>(
    'notifications/markAsRead',
    async (payload, { rejectWithValue }) => {
      try {
        // Use Case executes business logic (Domain layer)
        const useCase = new MarkNotificationAsReadUseCase(notificationRepository);
        await useCase.execute(payload);
        return payload;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        return rejectWithValue(message);
      }
    },
  ),

  markAllAsRead: createAsyncThunk<void, void>(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
      try {
        // Use Case executes business logic (Domain layer)
        const useCase = new MarkAllNotificationsAsReadUseCase(notificationRepository);
        await useCase.execute();
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),

  markAsUnread: createAsyncThunk<number, number>(
    'notifications/markAsUnread',
    async (notificationId, { rejectWithValue }) => {
      try {
        // Use Case executes business logic (Domain layer)
        const useCase = new MarkNotificationAsUnreadUseCase(notificationRepository);
        await useCase.execute(notificationId);
        return notificationId;
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),

  delete: createAsyncThunk<number, number>(
    'notifications/delete',
    async (notificationId, { rejectWithValue }) => {
      try {
        // Use Case executes business logic (Domain layer)
        const useCase = new DeleteNotificationUseCase(notificationRepository);
        await useCase.execute(notificationId);
        return notificationId;
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),
};
