import type { User } from '@/types/User';
import type { ConversationPriority } from '@/types/common';
import type { ConversationAdditionalAttributes } from '@/types/Conversation';

/**
 * Domain Layer: Notification Entity
 * 
 * Core business entity representing a notification.
 * Framework-independent, pure domain model.
 */

export type NotificationType =
  | 'sla_missed_next_response'
  | 'sla_missed_first_response'
  | 'sla_missed_resolution'
  | 'conversation_creation'
  | 'conversation_assignment'
  | 'assigned_conversation_new_message'
  | 'conversation_mention'
  | 'participating_conversation_new_message';

export type PrimaryActorType = 'Conversation' | 'Message';

export interface PrimaryActor {
  id: number;
  priority?: ConversationPriority | null;
  meta: {
    assignee: User;
    sender: User;
  };
  inboxId: number;
  additionalAttributes: ConversationAdditionalAttributes;
  conversationId: number;
}

export interface Notification {
  id: number;
  notificationType: NotificationType;
  pushMessageTitle: string;
  primaryActorType: PrimaryActorType;
  primaryActorId: number;
  primaryActor: PrimaryActor;
  readAt: string;
  user: User;
  snoozedUntil: string;
  createdAt: number;
  lastActivityAt: number;
  meta: object;
}

export interface NotificationMeta {
  unreadCount: number;
  count: number;
  currentPage: string;
}

