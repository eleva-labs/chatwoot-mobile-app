/**
 * Domain Layer: Notification Constants
 * 
 * Business constants for notifications.
 * Framework-independent domain values.
 */

import type { NotificationType } from './entities/Notification';

/**
 * Array of valid notification types
 * Used for validation and filtering
 */
export const NOTIFICATION_TYPES: NotificationType[] = [
  'conversation_creation',
  'conversation_assignment',
  'assigned_conversation_new_message',
  'conversation_mention',
  'participating_conversation_new_message',
  'sla_missed_first_response',
  'sla_missed_next_response',
  'sla_missed_resolution',
];

/**
 * Sort order options for inbox/notifications
 */
export const INBOX_SORT_OPTIONS = {
  asc: 'asc',
  desc: 'desc',
} as const;

export type InboxSortType = typeof INBOX_SORT_OPTIONS[keyof typeof INBOX_SORT_OPTIONS];

