/**
 * Test Data Builder for Conversation
 *
 * Creates valid Conversation objects with sensible defaults.
 * Use fluent methods to customize fields for specific test scenarios.
 */

import type {
  Conversation,
  ConversationAdditionalAttributes,
  ConversationMeta,
} from '@domain/types/Conversation';
import type { Message } from '@domain/types/Message';
import type { Agent } from '@domain/types/Agent';
import type { Channel } from '@domain/types/common/Channel';
import type { ConversationPriority } from '@domain/types/common/ConversationPriority';
import type { ConversationStatus } from '@domain/types/common/ConversationStatus';
import type { SLA, SLAEvent } from '@domain/types/common/SLA';

class ConversationBuilder {
  private conversation: Conversation = {
    accountId: 1,
    additionalAttributes: {},
    agentLastSeenAt: 0,
    assigneeLastSeenAt: 0,
    canReply: true,
    contactLastSeenAt: 0,
    createdAt: 1700000000,
    customAttributes: {},
    firstReplyCreatedAt: 0,
    id: 1,
    inboxId: 1,
    labels: [],
    lastActivityAt: 1700000000,
    muted: false,
    priority: null,
    snoozedUntil: null,
    status: 'open',
    unreadCount: 0,
    uuid: 'test-uuid-0001',
    waitingSince: 0,
    messages: [],
    lastNonActivityMessage: null,
    meta: {
      sender: {
        id: 1,
        name: 'Test Contact',
        email: null,
        phoneNumber: null,
        thumbnail: null,
        identifier: null,
        additionalAttributes: {},
        customAttributes: {},
        createdAt: 1700000000,
        lastActivityAt: null,
        type: 'contact',
      },
      assignee: {
        id: 1,
      },
      team: null,
      hmacVerified: null,
      channel: 'Channel::WebWidget',
    },
    timestamp: 1700000000,
    slaPolicyId: null,
    appliedSla: null,
    slaEvents: [],
  };

  withId(id: number): this {
    this.conversation.id = id;
    return this;
  }

  withStatus(status: ConversationStatus): this {
    this.conversation.status = status;
    return this;
  }

  withUnreadCount(count: number): this {
    this.conversation.unreadCount = count;
    return this;
  }

  withLabels(labels: string[]): this {
    this.conversation.labels = labels;
    return this;
  }

  withAssignee(assignee: Agent): this {
    this.conversation.meta = { ...this.conversation.meta, assignee };
    return this;
  }

  withInboxId(inboxId: number): this {
    this.conversation.inboxId = inboxId;
    return this;
  }

  withPriority(priority: ConversationPriority): this {
    this.conversation.priority = priority;
    return this;
  }

  withMeta(meta: ConversationMeta): this {
    this.conversation.meta = meta;
    return this;
  }

  withLastNonActivityMessage(message: Message | null): this {
    this.conversation.lastNonActivityMessage = message;
    return this;
  }

  withMessages(messages: Message[]): this {
    this.conversation.messages = messages;
    return this;
  }

  withAccountId(accountId: number): this {
    this.conversation.accountId = accountId;
    return this;
  }

  withMuted(muted: boolean): this {
    this.conversation.muted = muted;
    return this;
  }

  withChannel(channel: Channel): this {
    this.conversation.channel = channel;
    return this;
  }

  withAdditionalAttributes(attrs: ConversationAdditionalAttributes): this {
    this.conversation.additionalAttributes = attrs;
    return this;
  }

  withCreatedAt(createdAt: number): this {
    this.conversation.createdAt = createdAt;
    return this;
  }

  withLastActivityAt(lastActivityAt: number): this {
    this.conversation.lastActivityAt = lastActivityAt;
    return this;
  }

  withSnoozedUntil(snoozedUntil: number | null): this {
    this.conversation.snoozedUntil = snoozedUntil;
    return this;
  }

  withUuid(uuid: string): this {
    this.conversation.uuid = uuid;
    return this;
  }

  withSlaPolicyId(slaPolicyId: number | null): this {
    this.conversation.slaPolicyId = slaPolicyId;
    return this;
  }

  withAppliedSla(sla: SLA | null): this {
    this.conversation.appliedSla = sla;
    return this;
  }

  withSlaEvents(events: SLAEvent[]): this {
    this.conversation.slaEvents = events;
    return this;
  }

  build(): Conversation {
    return { ...this.conversation };
  }
}

export const aConversation = () => new ConversationBuilder();
