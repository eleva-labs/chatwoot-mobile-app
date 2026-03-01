/**
 * Zod schemas for conversation store
 *
 * These schemas validate API responses at runtime to ensure type safety
 * and catch contract changes early.
 */

import { z } from 'zod';

// ============================================================================
// Attachment Schema
// ============================================================================

export const AttachmentSchema = z.object({
  id: z.number(),
  message_id: z.number(),
  file_type: z.enum(['image', 'audio', 'video', 'file', 'ig_reel']),
  account_id: z.number(),
  extension: z.string().nullable(),
  data_url: z.string(),
  thumb_url: z.string().optional(),
  file_size: z.number().optional(),
  fallback_title: z.string().optional(),
  coordinates_lat: z.number().optional(),
  coordinates_long: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// ============================================================================
// Sender Schema
// ============================================================================

export const SenderSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  type: z.enum(['agent_bot', 'user', 'contact', 'agent']).optional(),
  email: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  available_name: z.string().optional(),
  availability_status: z.enum(['online', 'busy', 'offline']).nullable().optional(),
});

export type Sender = z.infer<typeof SenderSchema>;

// ============================================================================
// Message Content Attributes Schema
// ============================================================================

const MessageContentAttributesSchema = z
  .object({
    in_reply_to: z.number().optional(),
    in_reply_to_external_id: z.null().optional(),
    deleted: z.boolean().optional(),
    email: z
      .object({
        subject: z.string().optional(),
        from: z.array(z.string()).optional(),
        to: z.array(z.string()).optional(),
        cc: z.array(z.string()).optional(),
        bcc: z.array(z.string()).optional(),
        html_content: z
          .object({
            full: z.string(),
          })
          .optional(),
        text_content: z
          .object({
            full: z.string(),
          })
          .optional(),
      })
      .optional(),
    cc_emails: z.array(z.string()).optional(),
    bcc_emails: z.array(z.string()).optional(),
    external_error: z.string().optional(),
    image_type: z.string().optional(),
    content_type: z
      .enum([
        'text',
        'input_text',
        'input_textarea',
        'input_email',
        'input_select',
        'cards',
        'form',
        'article',
        'incoming_email',
        'input_csat',
        'integrations',
      ])
      .optional(),
    is_unsupported: z.boolean().optional(),
  })
  .nullable()
  .optional();

// ============================================================================
// Message Schema
// ============================================================================

export const MessageSchema = z.object({
  id: z.number(),
  content: z.string().nullable(),
  account_id: z.number().optional(), // Optional - not always present in message responses
  inbox_id: z.number(),
  conversation_id: z.number(),
  message_type: z.union([
    z.enum(['incoming', 'outgoing', 'activity', 'template']),
    z.number(), // API sometimes returns numeric codes (0=incoming, 1=outgoing, 2=activity, 3=template)
  ]),
  created_at: z.number(),
  updated_at: z.union([z.number(), z.string()]).optional(), // API returns string ISO date or Unix timestamp
  private: z.boolean(),
  status: z.enum(['sent', 'delivered', 'read', 'failed', 'progress']).optional(),
  source_id: z.string().nullable().optional(),
  content_type: z
    .enum([
      'text',
      'input_text',
      'input_textarea',
      'input_email',
      'input_select',
      'cards',
      'form',
      'article',
      'incoming_email',
      'input_csat',
      'integrations',
    ])
    .optional(),
  content_attributes: MessageContentAttributesSchema,
  sender_type: z.string().nullable().optional(),
  sender_id: z.number().nullable().optional(),
  external_source_ids: z.record(z.string(), z.unknown()).optional(),
  sender: SenderSchema.nullable().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  echo_id: z.union([z.number(), z.string(), z.null()]).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// ============================================================================
// Channel Schema
// ============================================================================

const ChannelSchema = z
  .union([
    z.object({
      id: z.number(),
      name: z.string(),
      type: z.string(),
    }),
    z.string(), // API sometimes returns channel as a string identifier
  ])
  .nullable()
  .optional();

// ============================================================================
// Conversation Metadata Schema
// ============================================================================

const AssigneeSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    available_name: z.string().optional(),
    avatar_url: z.string().nullable().optional(),
    type: z.string().optional(),
    availability_status: z.enum(['online', 'busy', 'offline']).optional(),
    thumbnail: z.string().nullable().optional(),
  })
  .nullable();

const TeamSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    allow_auto_assign: z.boolean().optional(),
    account_id: z.number(),
    is_member: z.boolean().optional(),
  })
  .nullable();

const SenderInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  type: z.string().optional(),
  thumbnail: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  additional_attributes: z.record(z.string(), z.unknown()).optional(),
  custom_attributes: z.record(z.string(), z.unknown()).optional(),
  contact_inboxes: z.array(z.unknown()).optional(),
});

const ConversationMetaSchema = z.object({
  sender: SenderInfoSchema.nullable().optional(),
  assignee: AssigneeSchema.optional(),
  team: TeamSchema.optional(),
  hmac_verified: z.boolean().nullable().optional(),
  channel: ChannelSchema.optional(),
});

// ============================================================================
// SLA Schemas
// ============================================================================

const SLASchema = z
  .object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
  })
  .nullable();

const SLAEventSchema = z.object({
  id: z.number(),
  event_type: z.string(),
  created_at: z.number(),
});

// ============================================================================
// Conversation Schema
// ============================================================================

export const ConversationSchema = z.object({
  id: z.number(),
  messages: z.array(MessageSchema),
  account_id: z.number(),
  additional_attributes: z.record(z.string(), z.unknown()).optional(),
  agent_last_seen_at: z.number().nullable().optional(),
  assignee_last_seen_at: z.number().nullable().optional(),
  can_reply: z.boolean(),
  contact_last_seen_at: z.number().nullable().optional(),
  custom_attributes: z.record(z.string(), z.unknown()).optional(),
  inbox_id: z.number(),
  labels: z.array(z.string()).optional(),
  meta: ConversationMetaSchema.optional(),
  muted: z.boolean().optional(),
  snoozed_until: z.number().nullable().optional(),
  status: z.enum(['open', 'resolved', 'pending', 'snoozed']),
  timestamp: z.number(),
  unread_count: z.number().optional(),
  first_reply_created_at: z.number().nullable().optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).nullable().optional(),
  waiting_since: z.number().nullable().optional(),
  uuid: z.string().optional(),
  created_at: z.number().optional(),
  last_activity_at: z.number().optional(),
  channel: ChannelSchema.optional(),
  sla_policy_id: z.number().nullable().optional(),
  applied_sla: SLASchema.optional(),
  sla_events: z.array(SLAEventSchema).optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// ============================================================================
// API Response Schemas
// ============================================================================

export const ConversationListResponseSchema = z.object({
  data: z.object({
    meta: z.object({
      mine_count: z.number(),
      unassigned_count: z.number(),
      assigned_count: z.number().optional(),
      all_count: z.number(),
      current_page: z.number().optional(),
      per_page: z.number().optional(),
    }),
    payload: z.array(ConversationSchema),
  }),
});

export const SingleConversationResponseSchema = z.object({
  data: ConversationSchema,
});

export const MessagesResponseSchema = z.object({
  meta: z.object({
    contact_last_seen_at: z.union([z.number(), z.string()]).nullable().optional(),
    agent_last_seen_at: z.union([z.number(), z.string()]).nullable().optional(),
  }),
  payload: z.array(MessageSchema),
});

export const SendMessageResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  inbox_id: z.number(),
  echo_id: z.string(),
  conversation_id: z.number(),
  message_type: z.enum(['incoming', 'outgoing', 'activity', 'template']),
  content_type: z.string(),
  status: z.enum(['sent', 'delivered', 'read', 'failed', 'progress']),
  content_attributes: z.record(z.string(), z.unknown()).optional(),
  created_at: z.number(),
  private: z.boolean(),
  source_id: z.string().nullable(),
  sender: SenderSchema,
});

export const ToggleConversationStatusResponseSchema = z.object({
  payload: z.object({
    conversation_id: z.number(),
    current_status: z.enum(['open', 'resolved', 'pending', 'snoozed']),
    snoozed_until: z.number().nullable(),
    success: z.boolean(),
  }),
});

export const AssigneeResponseSchema = z.object({
  data: z.object({
    payload: z.object({
      id: z.number(),
      name: z.string(),
      available_name: z.string().optional(),
      avatar_url: z.string().nullable().optional(),
      type: z.string().optional(),
      availability_status: z.enum(['online', 'busy', 'offline']).optional(),
      thumbnail: z.string().nullable().optional(),
    }),
  }),
});

export const AssignTeamResponseSchema = z.object({
  data: z.object({
    payload: z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().nullable().optional(),
      allow_auto_assign: z.boolean().optional(),
      account_id: z.number(),
      is_member: z.boolean().optional(),
    }),
  }),
});

export const MarkMessagesUnreadResponseSchema = z.object({
  id: z.number(),
  unread_count: z.number(),
  agent_last_seen_at: z.number(),
});

export const MarkMessageReadResponseSchema = z.object({
  id: z.number(),
  agent_last_seen_at: z.number(),
  unread_count: z.number(),
});

export const DeleteMessageResponseSchema = z.object({
  data: MessageSchema,
});

// ============================================================================
// Validation Helpers
// ============================================================================

export const validateConversationList = (data: unknown) => {
  return ConversationListResponseSchema.parse(data);
};

export const validateSingleConversation = (data: unknown) => {
  return SingleConversationResponseSchema.parse(data);
};

export const validateMessages = (data: unknown) => {
  return MessagesResponseSchema.parse(data);
};

export const validateSendMessage = (data: unknown) => {
  return SendMessageResponseSchema.parse(data);
};

export const validateToggleConversationStatus = (data: unknown) => {
  return ToggleConversationStatusResponseSchema.parse(data);
};

export const validateAssignee = (data: unknown) => {
  return AssigneeResponseSchema.parse(data);
};

export const validateAssignTeam = (data: unknown) => {
  return AssignTeamResponseSchema.parse(data);
};

export const validateMarkMessagesUnread = (data: unknown) => {
  return MarkMessagesUnreadResponseSchema.parse(data);
};

export const validateMarkMessageRead = (data: unknown) => {
  return MarkMessageReadResponseSchema.parse(data);
};

export const validateDeleteMessage = (data: unknown) => {
  return DeleteMessageResponseSchema.parse(data);
};
