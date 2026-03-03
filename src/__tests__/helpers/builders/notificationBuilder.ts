/**
 * Test Data Builder for Notification
 *
 * Creates valid Notification objects with sensible defaults.
 * Use fluent methods to customize fields for specific test scenarios.
 */

import type { Notification, NotificationType, PrimaryActor } from '@domain/types/Notification';
import type { User } from '@domain/types/User';

const defaultUser: User = {
  id: 1,
  name: 'Test User',
  account_id: 1,
  accounts: [],
  email: 'user@example.com',
  pubsub_token: 'test-pubsub-token',
  avatar_url: '',
  available_name: 'Test User',
  role: 'agent',
  identifier_hash: '',
  availability: 'online',
  thumbnail: '',
  availability_status: 'online',
  type: 'user',
};

const defaultPrimaryActor: PrimaryActor = {
  id: 1,
  priority: null,
  meta: {
    assignee: { ...defaultUser },
    sender: { ...defaultUser, id: 2, name: 'Sender User' },
  },
  inboxId: 1,
  additionalAttributes: {},
  conversationId: 1,
};

class NotificationBuilder {
  private notification: Notification = {
    id: 1,
    notificationType: 'conversation_assignment',
    pushMessageTitle: 'Test notification',
    primaryActorType: 'Conversation',
    primaryActorId: 1,
    primaryActor: { ...defaultPrimaryActor },
    readAt: '',
    user: { ...defaultUser },
    snoozedUntil: '',
    createdAt: 1700000000,
    lastActivityAt: 1700000000,
    meta: {},
  };

  withId(id: number): this {
    this.notification.id = id;
    return this;
  }

  withNotificationType(type: NotificationType): this {
    this.notification.notificationType = type;
    return this;
  }

  withRead(): this {
    this.notification.readAt = new Date().toISOString();
    return this;
  }

  withUnread(): this {
    this.notification.readAt = '';
    return this;
  }

  withPrimaryActor(actor: PrimaryActor): this {
    this.notification.primaryActor = actor;
    return this;
  }

  withPrimaryActorId(id: number): this {
    this.notification.primaryActorId = id;
    return this;
  }

  withPushMessageTitle(title: string): this {
    this.notification.pushMessageTitle = title;
    return this;
  }

  withUser(user: User): this {
    this.notification.user = user;
    return this;
  }

  withSnoozedUntil(snoozedUntil: string): this {
    this.notification.snoozedUntil = snoozedUntil;
    return this;
  }

  withCreatedAt(createdAt: number): this {
    this.notification.createdAt = createdAt;
    return this;
  }

  withLastActivityAt(lastActivityAt: number): this {
    this.notification.lastActivityAt = lastActivityAt;
    return this;
  }

  withMeta(meta: object): this {
    this.notification.meta = meta;
    return this;
  }

  build(): Notification {
    return { ...this.notification };
  }
}

export const aNotification = () => new NotificationBuilder();
