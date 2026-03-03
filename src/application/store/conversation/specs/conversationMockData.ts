import type { Conversation } from '@domain/types';

/**
 * Snake_case conversation as returned by the API (before camelCase transformation).
 * This is what the Zod schemas validate.
 */
export const snakeCaseConversation = {
  id: 250,
  account_id: 1,
  additional_attributes: {},
  agent_last_seen_at: 1,
  assignee_last_seen_at: 1,
  can_reply: true,
  contact_last_seen_at: 1,
  created_at: 1,
  custom_attributes: {},
  first_reply_created_at: 1,
  inbox_id: 1,
  labels: [],
  last_activity_at: 1,
  muted: false,
  priority: 'low' as const,
  snoozed_until: null,
  status: 'open' as const,
  unread_count: 1,
  uuid: '123',
  waiting_since: 1,
  messages: [],
  meta: {
    sender: {
      id: 1,
      name: 'Test Sender',
      thumbnail: '',
      email: '',
      phone_number: null,
      additional_attributes: {},
      custom_attributes: {},
    },
    assignee: {
      id: 1,
      name: 'Test Assignee',
      thumbnail: '',
    },
    team: null,
    hmac_verified: false,
    channel: 'Channel::Whatsapp',
  },
  timestamp: 1,
  sla_policy_id: null,
  applied_sla: null,
  sla_events: [],
};

/**
 * CamelCase conversation (domain type, after transformation).
 */
export const conversation: Conversation = {
  id: 250,
  accountId: 1,
  additionalAttributes: {},
  agentLastSeenAt: 1,
  assigneeLastSeenAt: 1,
  canReply: true,
  contactLastSeenAt: 1,
  createdAt: 1,
  customAttributes: {},
  firstReplyCreatedAt: 1,
  inboxId: 1,
  labels: [],
  lastActivityAt: 1,
  muted: false,
  priority: 'low',
  snoozedUntil: null,
  status: 'open',
  unreadCount: 1,
  uuid: '123',
  waitingSince: 1,
  messages: [],
  lastNonActivityMessage: null,
  meta: {
    sender: {
      id: 1,
      name: 'Test Sender',
      thumbnail: '',
      email: '',
      phoneNumber: null,
      additionalAttributes: {},
      customAttributes: {},
      createdAt: 1,
      identifier: null,
      lastActivityAt: 1,
      type: 'contact',
    },
    assignee: {
      id: 1,
      name: 'Test Assignee',
      thumbnail: '',
      email: '',
      customAttributes: {},
    },
    team: null,
    hmacVerified: false,
    channel: 'Channel::Whatsapp',
  },
  timestamp: 1,
  slaPolicyId: null,
  appliedSla: null,
  slaEvents: [],
};

/**
 * Snake_case conversation list API response (what the API returns).
 */
export const conversationListApiResponse = {
  data: {
    meta: {
      mine_count: 1,
      unassigned_count: 1,
      all_count: 1,
    },
    payload: [snakeCaseConversation],
  },
};

/**
 * @deprecated Use snakeCaseConversation instead
 */
export const smallCaseConversation = snakeCaseConversation;
