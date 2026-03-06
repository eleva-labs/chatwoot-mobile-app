/**
 * Test Data Builder for Message
 *
 * Creates valid Message objects with sensible defaults.
 * Use fluent methods to customize fields for specific test scenarios.
 */

import type {
  Message,
  MessageType,
  MessageStatus,
  MessageContentAttributes,
  ContentType,
  ImageMetadata,
} from '@domain/types/Message';
import type { Agent } from '@domain/types/Agent';
import type { Contact } from '@domain/types/Contact';
import type { Conversation } from '@domain/types/Conversation';
import type { User } from '@domain/types/User';

class MessageBuilder {
  private message: Message = {
    id: 1,
    attachments: [],
    content: 'Test message content',
    contentType: 'text',
    conversationId: 1,
    createdAt: 1700000000,
    echoId: null,
    inboxId: 1,
    messageType: 0, // incoming
    private: false,
    sourceId: null,
    status: 'sent',
    lastNonActivityMessage: null,
    senderId: 1,
  };

  withId(id: number): this {
    this.message.id = id;
    return this;
  }

  withContent(content: string | null): this {
    this.message.content = content;
    return this;
  }

  withMessageType(messageType: MessageType): this {
    this.message.messageType = messageType;
    return this;
  }

  withSender(sender: Agent | User | Contact | null): this {
    this.message.sender = sender;
    return this;
  }

  withCreatedAt(createdAt: number): this {
    this.message.createdAt = createdAt;
    return this;
  }

  withConversationId(conversationId: number): this {
    this.message.conversationId = conversationId;
    return this;
  }

  withInboxId(inboxId: number): this {
    this.message.inboxId = inboxId;
    return this;
  }

  withStatus(status: MessageStatus): this {
    this.message.status = status;
    return this;
  }

  withContentType(contentType: ContentType): this {
    this.message.contentType = contentType;
    return this;
  }

  withAttachments(attachments: ImageMetadata[]): this {
    this.message.attachments = attachments;
    return this;
  }

  withPrivate(isPrivate: boolean): this {
    this.message.private = isPrivate;
    return this;
  }

  withSourceId(sourceId: string | null): this {
    this.message.sourceId = sourceId;
    return this;
  }

  withEchoId(echoId: number | string | null): this {
    this.message.echoId = echoId;
    return this;
  }

  withSenderId(senderId: number): this {
    this.message.senderId = senderId;
    return this;
  }

  withSenderType(senderType: string): this {
    this.message.senderType = senderType;
    return this;
  }

  withContentAttributes(attrs: Partial<MessageContentAttributes> | null): this {
    this.message.contentAttributes = attrs as MessageContentAttributes;
    return this;
  }

  withConversationMeta(meta: { unreadCount?: number }): this {
    // We only need a partial conversation object for this test purpose
    // The slice code only accesses message.conversation?.unreadCount
    this.message.conversation = { unreadCount: meta.unreadCount ?? 0 } as Conversation;
    return this;
  }

  build(): Message {
    return { ...this.message };
  }
}

export const aMessage = () => new MessageBuilder();
