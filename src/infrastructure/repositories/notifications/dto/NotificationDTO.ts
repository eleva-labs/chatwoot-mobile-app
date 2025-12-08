/**
 * Infrastructure Layer: Notification DTOs (Data Transfer Objects)
 *
 * DTOs represent the data format received from the API.
 * These match the backend's snake_case format exactly.
 */

/**
 * Notification DTO - matches API response format (snake_case)
 */
export interface NotificationDTO {
  id: number;
  notification_type: string;
  push_message_title: string;
  primary_actor_type: 'Conversation' | 'Message';
  primary_actor_id: number;
  primary_actor: PrimaryActorDTO;
  read_at: string | null;
  user: UserDTO;
  snoozed_until: string | null;
  created_at: number;
  last_activity_at: number;
  meta: Record<string, unknown>;
}

/**
 * Primary Actor DTO - matches API response format
 */
export interface PrimaryActorDTO {
  id: number;
  priority?: string | null;
  meta: {
    assignee: UserDTO;
    sender: UserDTO;
  };
  inbox_id: number;
  additional_attributes: Record<string, unknown>;
  conversation_id: number;
}

/**
 * User DTO - matches API response format
 */
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown; // Allow additional fields from API
}

/**
 * Notification Meta DTO - matches API response format
 */
export interface NotificationMetaDTO {
  unread_count: number;
  count: number;
  current_page: string;
}

/**
 * Notification API Response DTO - complete API response structure
 */
export interface NotificationAPIResponseDTO {
  data: {
    meta: NotificationMetaDTO;
    payload: NotificationDTO[];
  };
}

