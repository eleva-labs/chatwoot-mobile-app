import {
  updateConversation,
  updateConversationLastActivity,
  addConversation,
  addOrUpdateMessage,
} from '@application/store/conversation/conversationSlice';
import {
  addContact,
  updateContact,
  updateContactsPresence,
  removeContact,
} from '@application/store/contact/contactSlice';
import {
  setTypingUsers,
  removeTypingUser,
} from '@application/store/conversation/conversationTypingSlice';
import BaseActionCableConnector from '@infrastructure/utils/baseActionCableConnector';
import type { AppDispatch, RootState } from '@application/store';
import type { RealtimeConfig } from '@application/store/realtime/realtimeTypes';
import { Contact, Conversation, Message, PresenceUpdateData, TypingData } from '@domain/types';
import {
  transformMessage,
  transformConversation,
  transformTypingData,
  transformContact,
  transformNotificationCreatedResponse,
  transformNotificationRemovedResponse,
} from '@infrastructure/utils/camelCaseKeys';
import {
  addNotification,
  removeNotification,
} from '@application/store/notification/notificationSlice';
import { setCurrentUserAvailability } from '@application/store/auth/authSlice';
import {
  NotificationCreatedResponse,
  NotificationRemovedResponse,
} from '@application/store/notification/notificationTypes';
import { conversationActions } from '@application/store/conversation/conversationActions';

export class ActionCableConnector extends BaseActionCableConnector {
  private readonly dispatch: AppDispatch;
  private readonly getState: () => RootState;
  private readonly fetchingConversations: Set<number>;
  private CancelTyping: { [key: number]: NodeJS.Timeout | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected events: { [key: string]: (data: any) => void };

  constructor(
    config: RealtimeConfig,
    dispatch: AppDispatch,
    getState: () => RootState,
    fetchingConversations: Set<number>,
  ) {
    super(config);
    this.dispatch = dispatch;
    this.getState = getState;
    this.fetchingConversations = fetchingConversations;
    this.CancelTyping = {};
    this.events = {
      'message.created': this.onMessageCreated,
      'message.updated': this.onMessageUpdated,
      'conversation.created': this.onConversationCreated,
      'conversation.status_changed': this.onStatusChange,
      'conversation.read': this.onConversationRead,
      'assignee.changed': this.onAssigneeChanged,
      'conversation.updated': this.onConversationUpdated,
      'conversation.typing_on': this.onTypingOn,
      'conversation.typing_off': this.onTypingOff,
      'contact.updated': this.onContactUpdate,
      'notification.created': this.onNotificationCreated,
      'notification.deleted': this.onNotificationRemoved,
      'presence.update': this.onPresenceUpdate,

      'conversation.contact_changed': this.onConversationContactChange,
      'contact.deleted': this.onContactDelete,
      'conversation.mentioned': this.onConversationMentioned,
      'first.reply.created': this.onFirstReplyCreated,
    };
  }

  onMessageCreated = (data: Message) => {
    const message = transformMessage(data);
    const { conversation, conversationId } = message;
    const lastActivityAt = conversation?.lastActivityAt;
    this.dispatch(updateConversationLastActivity({ lastActivityAt, conversationId }));
    this.dispatch(addOrUpdateMessage(message));

    // Fix 2.2: If the conversation is not in the store, fetch it so the list stays up-to-date
    if (conversationId != null) {
      const state = this.getState();
      const isLoaded = state.conversations.entities[conversationId] != null;
      if (!isLoaded && !this.fetchingConversations.has(conversationId)) {
        this.fetchingConversations.add(conversationId);
        this.dispatch(conversationActions.fetchConversation(conversationId))
          .then(() => {
            this.fetchingConversations.delete(conversationId);
          })
          .catch(() => {
            this.fetchingConversations.delete(conversationId);
          });
      }
    }
  };

  onConversationCreated = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(addConversation(conversation));
    this.dispatch(addContact(conversation));
  };

  onMessageUpdated = (data: Message) => {
    const message = transformMessage(data);
    this.dispatch(addOrUpdateMessage(message));
  };

  onConversationUpdated = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(updateConversation(conversation));
    this.dispatch(addContact(conversation));
  };

  onAssigneeChanged = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(updateConversation(conversation));
  };

  onStatusChange = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(updateConversation(conversation));
  };

  onConversationRead = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(updateConversation(conversation));
  };

  onContactUpdate = (data: Contact) => {
    const contact = transformContact(data);
    this.dispatch(updateContact(contact));
  };

  onNotificationCreated = (data: NotificationCreatedResponse) => {
    const notification: NotificationCreatedResponse = transformNotificationCreatedResponse(data);
    this.dispatch(addNotification(notification));
  };

  onNotificationRemoved = (data: NotificationRemovedResponse) => {
    const notification: NotificationRemovedResponse = transformNotificationRemovedResponse(data);
    this.dispatch(removeNotification(notification));
  };

  onTypingOn = (data: TypingData) => {
    const typingData = transformTypingData(data);
    const { conversation, user } = typingData;
    const conversationId = conversation.id;
    this.dispatch(setTypingUsers({ conversationId, user }));
    this.initTimer(typingData);
  };

  onTypingOff = (data: TypingData) => {
    const typingData = transformTypingData(data);
    const { conversation, user } = typingData;
    const conversationId = conversation.id;
    this.dispatch(removeTypingUser({ conversationId, user }));
    this.clearTimer(conversationId);
  };

  private initTimer = (data: TypingData) => {
    const { conversation } = data;
    const conversationId = conversation.id;
    if (this.CancelTyping[conversationId]) {
      clearTimeout(this.CancelTyping[conversationId]!);
      this.CancelTyping[conversationId] = null;
    }
    this.CancelTyping[conversationId] = setTimeout(() => {
      this.onTypingOff(data);
    }, 30000);
  };

  private clearTimer = (conversationId: number) => {
    if (this.CancelTyping[conversationId]) {
      clearTimeout(this.CancelTyping[conversationId]!);
      this.CancelTyping[conversationId] = null;
    }
  };

  onPresenceUpdate = (data: PresenceUpdateData) => {
    const { contacts, users } = data;
    this.dispatch(
      updateContactsPresence({
        contacts,
      }),
    );
    this.dispatch(
      setCurrentUserAvailability({
        users,
      }),
    );
  };

  // Fix 3.1 — conversation.mentioned
  onConversationMentioned = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(updateConversation(conversation));
  };

  // Fix 3.2 — first.reply.created (same pattern as onMessageCreated)
  onFirstReplyCreated = (data: Message) => {
    const message = transformMessage(data);
    const { conversation, conversationId } = message;
    const lastActivityAt = conversation?.lastActivityAt;
    this.dispatch(updateConversationLastActivity({ lastActivityAt, conversationId }));
    this.dispatch(addOrUpdateMessage(message));

    // Guard: if the conversation is not yet in the store, fetch it
    if (conversationId != null) {
      const state = this.getState();
      const isLoaded = state.conversations.entities[conversationId] != null;
      if (!isLoaded && !this.fetchingConversations.has(conversationId)) {
        this.fetchingConversations.add(conversationId);
        this.dispatch(conversationActions.fetchConversation(conversationId))
          .then(() => {
            this.fetchingConversations.delete(conversationId);
          })
          .catch(() => {
            this.fetchingConversations.delete(conversationId);
          });
      }
    }
  };

  // Fix 3.3 — contact.deleted
  onContactDelete = (data: { id: number }) => {
    this.dispatch(removeContact(data.id));
  };

  // Fix 3.4 — conversation.contact_changed
  onConversationContactChange = (data: Conversation) => {
    const conversation = transformConversation(data);
    this.dispatch(updateConversation(conversation));
  };
}
