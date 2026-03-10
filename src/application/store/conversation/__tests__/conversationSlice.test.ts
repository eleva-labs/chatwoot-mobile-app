import reducer, {
  clearAllConversations,
  addConversation,
  updateConversation,
  addOrUpdateMessage,
  updateConversationLastActivity,
  conversationAdapter,
} from '../conversationSlice';
import { conversationActions } from '../conversationActions';
import { aConversation, aMessage } from '@/__tests__/helpers/builders';
import { MESSAGE_TYPES } from '@domain/constants';
import { Conversation } from '@domain/types/Conversation';
import { findPendingMessageIndex } from '@infrastructure/utils/conversationUtils';

jest.mock('@infrastructure/utils/conversationUtils', () => ({
  findPendingMessageIndex: jest.fn(),
}));
const mockFindPendingMessageIndex = findPendingMessageIndex as jest.MockedFunction<
  typeof findPendingMessageIndex
>;

const getInitialState = () =>
  conversationAdapter.getInitialState({
    meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
    error: null,
    isLoadingConversations: false,
    isAllConversationsFetched: false,
    isLoadingMessages: false,
    isAllMessagesFetched: false,
    isConversationFetching: false,
    isChangingConversationStatus: false,
  });

const stateWithConversation = (conversation: Conversation) => ({
  ...getInitialState(),
  ids: [conversation.id],
  entities: { [conversation.id]: conversation },
});

describe('conversationSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return the correct initial state', () => {
      const state = reducer(undefined, { type: '@@INIT' });
      expect(state).toEqual(getInitialState());
    });
  });

  describe('clearAllConversations', () => {
    it('should remove all conversations from entity adapter', () => {
      const conversation = aConversation().withId(1).build();
      const initialState = stateWithConversation(conversation);

      const state = reducer(initialState, clearAllConversations());

      expect(state.ids).toEqual([]);
      expect(state.entities).toEqual({});
    });
  });

  describe('addConversation', () => {
    it('should add a new conversation to the store', () => {
      const conversation = aConversation().withId(42).build();

      const state = reducer(getInitialState(), addConversation(conversation));

      expect(state.ids).toContain(42);
      expect(state.entities[42]).toEqual(conversation);
    });

    it('should throw or no-op when adding conversation with already-existing ID', () => {
      const conversation = aConversation().withId(42).build();
      const stateWithExisting = stateWithConversation(conversation);
      const duplicateConversation = aConversation().withId(42).withStatus('resolved').build();

      // EntityAdapter.addOne does NOT update existing — it's a no-op for existing IDs
      const state = reducer(stateWithExisting, addConversation(duplicateConversation));

      // The original conversation should remain unchanged
      expect(state.entities[42]?.status).toBe('open');
    });
  });

  describe('updateConversation', () => {
    it('should update an existing conversation attributes without replacing messages', () => {
      const existingMessage = aMessage().withId(100).build();
      const conversation = aConversation()
        .withId(1)
        .withMessages([existingMessage])
        .withStatus('open')
        .build();
      const initialState = stateWithConversation(conversation);

      const updatedConversation = aConversation()
        .withId(1)
        .withMessages([]) // messages should be excluded from update
        .withStatus('resolved')
        .build();

      const state = reducer(initialState, updateConversation(updatedConversation));

      expect(state.entities[1]?.status).toBe('resolved');
      // Messages from the update should NOT overwrite existing messages
      expect(state.entities[1]?.messages).toEqual([existingMessage]);
    });

    it('should add conversation if ID is not already in the store', () => {
      const conversation = aConversation().withId(99).build();

      const state = reducer(getInitialState(), updateConversation(conversation));

      expect(state.ids).toContain(99);
      expect(state.entities[99]).toEqual(conversation);
    });
  });

  describe('addOrUpdateMessage', () => {
    it('should add a new message to an existing conversation', () => {
      const conversation = aConversation().withId(1).withMessages([]).build();
      const initialState = stateWithConversation(conversation);
      const message = aMessage().withId(10).withConversationId(1).build();
      mockFindPendingMessageIndex.mockReturnValue(-1);

      const state = reducer(initialState, addOrUpdateMessage(message));

      expect(state.entities[1]?.messages).toHaveLength(1);
      expect(state.entities[1]?.messages[0]).toEqual(message);
    });

    it('should replace a pending message at the matching index', () => {
      const pendingMessage = aMessage()
        .withId(5)
        .withConversationId(1)
        .withStatus('progress')
        .build();
      const conversation = aConversation().withId(1).withMessages([pendingMessage]).build();
      const initialState = stateWithConversation(conversation);
      const confirmedMessage = aMessage()
        .withId(5)
        .withConversationId(1)
        .withStatus('sent')
        .build();
      mockFindPendingMessageIndex.mockReturnValue(0);

      const state = reducer(initialState, addOrUpdateMessage(confirmedMessage));

      expect(state.entities[1]?.messages).toHaveLength(1);
      expect(state.entities[1]?.messages[0]).toEqual(confirmedMessage);
    });

    it('should set canReply = true when message is incoming', () => {
      const conversation = aConversation().withId(1).withMessages([]).withCanReply(false).build();
      const initialState = stateWithConversation(conversation);
      const incomingMessage = aMessage()
        .withId(10)
        .withConversationId(1)
        .withMessageType(MESSAGE_TYPES.INCOMING)
        .build();
      mockFindPendingMessageIndex.mockReturnValue(-1);

      const state = reducer(initialState, addOrUpdateMessage(incomingMessage));

      expect(state.entities[1]?.canReply).toBe(true);
    });

    it('should update conversation.timestamp to message.createdAt', () => {
      const conversation = aConversation().withId(1).withMessages([]).build();
      const initialState = stateWithConversation(conversation);
      const message = aMessage().withId(10).withConversationId(1).withCreatedAt(1800000000).build();
      mockFindPendingMessageIndex.mockReturnValue(-1);

      const state = reducer(initialState, addOrUpdateMessage(message));

      expect(state.entities[1]?.timestamp).toBe(1800000000);
    });

    it('should update conversation.unreadCount from message.conversation.unreadCount', () => {
      const conversation = aConversation().withId(1).withMessages([]).withUnreadCount(0).build();
      const initialState = stateWithConversation(conversation);
      const message = aMessage()
        .withId(10)
        .withConversationId(1)
        .withConversationMeta({ unreadCount: 5 })
        .build();
      mockFindPendingMessageIndex.mockReturnValue(-1);

      const state = reducer(initialState, addOrUpdateMessage(message));

      expect(state.entities[1]?.unreadCount).toBe(5);
    });

    it('should be a no-op when conversationId is falsy', () => {
      const conversation = aConversation().withId(1).withMessages([]).build();
      const initialState = stateWithConversation(conversation);
      const message = aMessage().withId(10).withConversationId(0).build();

      const state = reducer(initialState, addOrUpdateMessage(message));

      expect(state.entities[1]?.messages).toHaveLength(0);
    });

    it('should be a no-op when conversation is not in the store', () => {
      const initialState = getInitialState();
      const message = aMessage().withId(10).withConversationId(999).build();

      const state = reducer(initialState, addOrUpdateMessage(message));

      expect(state).toEqual(initialState);
    });

    it('should update in-place when same numeric ID exists but findPendingMessageIndex returns -1', () => {
      const existingMessage = aMessage()
        .withId(10)
        .withConversationId(1)
        .withStatus('sent')
        .build();
      const conversation = aConversation().withId(1).withMessages([existingMessage]).build();
      const initialState = stateWithConversation(conversation);
      const duplicateMessage = aMessage()
        .withId(10)
        .withConversationId(1)
        .withStatus('delivered')
        .build();
      mockFindPendingMessageIndex.mockReturnValue(-1);

      const state = reducer(initialState, addOrUpdateMessage(duplicateMessage));

      // Numeric ID dedup should prevent a duplicate; the existing message is updated in-place
      expect(state.entities[1]?.messages).toHaveLength(1);
      expect(state.entities[1]?.messages[0].status).toBe('delivered');
    });

    it('should push message when ID is a string (pending message)', () => {
      const existingMessage = aMessage()
        .withId(10)
        .withConversationId(1)
        .withStatus('sent')
        .build();
      const conversation = aConversation().withId(1).withMessages([existingMessage]).build();
      const initialState = stateWithConversation(conversation);
      // Pending messages have string IDs (echoIds) — they should still be pushed normally
      const pendingMessage = {
        ...aMessage().withConversationId(1).withStatus('progress').build(),
        id: 'temp-uuid-456' as unknown as number,
        echoId: 'temp-uuid-456',
      };
      mockFindPendingMessageIndex.mockReturnValue(-1);

      const state = reducer(initialState, addOrUpdateMessage(pendingMessage));

      // String ID should bypass the numeric dedup guard and push normally
      expect(state.entities[1]?.messages).toHaveLength(2);
      expect(state.entities[1]?.messages[0]).toEqual(existingMessage);
      expect(state.entities[1]?.messages[1].id).toBe('temp-uuid-456');
    });
  });

  describe('updateConversationLastActivity', () => {
    it('should update lastActivityAt on the conversation', () => {
      const conversation = aConversation().withId(1).withLastActivityAt(1700000000).build();
      const initialState = stateWithConversation(conversation);

      const state = reducer(
        initialState,
        updateConversationLastActivity({ conversationId: 1, lastActivityAt: 1900000000 }),
      );

      expect(state.entities[1]?.lastActivityAt).toBe(1900000000);
    });

    it('should be a no-op when conversation is not in the store', () => {
      const initialState = getInitialState();

      const state = reducer(
        initialState,
        updateConversationLastActivity({ conversationId: 999, lastActivityAt: 1900000000 }),
      );

      expect(state).toEqual(initialState);
    });
  });

  describe('fetchConversations extraReducers', () => {
    it('pending: should set isLoadingConversations = true and clear error', () => {
      const initial = { ...getInitialState(), error: 'previous error' };
      const action = { type: conversationActions.fetchConversations.pending.type };

      const state = reducer(initial, action);

      expect(state.isLoadingConversations).toBe(true);
      expect(state.error).toBeNull();
    });

    it('fulfilled: should upsert conversations, update meta, and set loading flags', () => {
      const conversations = [aConversation().withId(1).build(), aConversation().withId(2).build()];
      const meta = { mineCount: 5, unassignedCount: 3, allCount: 10 };
      const action = {
        type: conversationActions.fetchConversations.fulfilled.type,
        payload: { conversations, meta },
      };
      const initial = { ...getInitialState(), isLoadingConversations: true };

      const state = reducer(initial, action);

      expect(state.ids).toContain(1);
      expect(state.ids).toContain(2);
      expect(state.isLoadingConversations).toBe(false);
      expect(state.isAllConversationsFetched).toBe(true); // 2 < 20
      expect(state.meta).toEqual(meta);
    });

    it('fulfilled: should set isAllConversationsFetched = false when 20 or more conversations', () => {
      const conversations = Array.from({ length: 20 }, (_, i) =>
        aConversation()
          .withId(i + 1)
          .build(),
      );
      const meta = { mineCount: 0, unassignedCount: 0, allCount: 20 };
      const action = {
        type: conversationActions.fetchConversations.fulfilled.type,
        payload: { conversations, meta },
      };

      const state = reducer(getInitialState(), action);

      expect(state.isAllConversationsFetched).toBe(false);
    });

    it('rejected: should set isLoadingConversations = false', () => {
      const initial = { ...getInitialState(), isLoadingConversations: true };
      const action = {
        type: conversationActions.fetchConversations.rejected.type,
        error: { message: 'Network error' },
      };

      const state = reducer(initial, action);

      expect(state.isLoadingConversations).toBe(false);
    });
  });

  describe('fetchConversation extraReducers', () => {
    it('pending: should set isConversationFetching = true and clear error', () => {
      const initial = { ...getInitialState(), error: 'some error' };
      const action = { type: conversationActions.fetchConversation.pending.type };

      const state = reducer(initial, action);

      expect(state.isConversationFetching).toBe(true);
      expect(state.error).toBeNull();
    });

    it('fulfilled: should upsert single conversation and reset flags', () => {
      const conversation = aConversation().withId(7).build();
      const action = {
        type: conversationActions.fetchConversation.fulfilled.type,
        payload: { conversation },
      };
      const initial = {
        ...getInitialState(),
        isConversationFetching: true,
        isAllMessagesFetched: true,
      };

      const state = reducer(initial, action);

      expect(state.entities[7]).toBeDefined();
      expect(state.isConversationFetching).toBe(false);
      expect(state.isAllMessagesFetched).toBe(false);
    });

    it('rejected: should set isConversationFetching = false and set fallback error', () => {
      const initial = { ...getInitialState(), isConversationFetching: true };
      const action = { type: conversationActions.fetchConversation.rejected.type };

      const state = reducer(initial, action);

      expect(state.isConversationFetching).toBe(false);
      expect(state.error).toBe('Unable to load conversation');
    });
  });

  describe('fetchPreviousMessages extraReducers', () => {
    it('pending: should set isLoadingMessages = true', () => {
      const action = { type: conversationActions.fetchPreviousMessages.pending.type };

      const state = reducer(getInitialState(), action);

      expect(state.isLoadingMessages).toBe(true);
    });

    it('fulfilled: should unshift messages into conversation and update meta', () => {
      const existingMessage = aMessage().withId(10).withConversationId(1).build();
      const conversation = aConversation().withId(1).withMessages([existingMessage]).build();
      const initialState = stateWithConversation(conversation);

      const newMessages = [
        aMessage().withId(8).withConversationId(1).build(),
        aMessage().withId(9).withConversationId(1).build(),
      ];
      const newMeta = {
        sender: conversation.meta.sender,
        assignee: conversation.meta.assignee,
        team: null,
        hmacVerified: null,
        channel: 'Channel::WebWidget' as const,
      };
      const action = {
        type: conversationActions.fetchPreviousMessages.fulfilled.type,
        payload: { messages: newMessages, conversationId: 1, meta: newMeta },
      };

      const state = reducer({ ...initialState, isLoadingMessages: true }, action);

      expect(state.entities[1]?.messages).toHaveLength(3);
      expect(state.entities[1]?.messages[0].id).toBe(8);
      expect(state.entities[1]?.messages[1].id).toBe(9);
      expect(state.entities[1]?.messages[2].id).toBe(10);
      expect(state.isLoadingMessages).toBe(false);
      expect(state.isAllMessagesFetched).toBe(true); // 2 < 20
    });

    it('fulfilled: should be a no-op if conversation is not in the store', () => {
      const initialState = getInitialState();
      const action = {
        type: conversationActions.fetchPreviousMessages.fulfilled.type,
        payload: { messages: [aMessage().build()], conversationId: 999, meta: {} },
      };

      const state = reducer(initialState, action);

      expect(state.ids).toHaveLength(0);
    });

    it('rejected: should set isLoadingMessages = false', () => {
      const initial = { ...getInitialState(), isLoadingMessages: true };
      const action = { type: conversationActions.fetchPreviousMessages.rejected.type };

      const state = reducer(initial, action);

      expect(state.isLoadingMessages).toBe(false);
    });
  });

  describe('toggleConversationStatus extraReducers', () => {
    it('pending: should set isChangingConversationStatus = true', () => {
      const action = { type: conversationActions.toggleConversationStatus.pending.type };

      const state = reducer(getInitialState(), action);

      expect(state.isChangingConversationStatus).toBe(true);
    });

    it('fulfilled: should update conversation status and snoozedUntil', () => {
      const conversation = aConversation().withId(1).withStatus('open').build();
      const initialState = stateWithConversation(conversation);
      const action = {
        type: conversationActions.toggleConversationStatus.fulfilled.type,
        payload: { conversationId: 1, currentStatus: 'snoozed', snoozedUntil: 1800000000 },
      };

      const state = reducer({ ...initialState, isChangingConversationStatus: true }, action);

      expect(state.entities[1]?.status).toBe('snoozed');
      expect(state.entities[1]?.snoozedUntil).toBe(1800000000);
      expect(state.isChangingConversationStatus).toBe(false);
    });

    it('rejected: should set isChangingConversationStatus = false', () => {
      const initial = { ...getInitialState(), isChangingConversationStatus: true };
      const action = { type: conversationActions.toggleConversationStatus.rejected.type };

      const state = reducer(initial, action);

      expect(state.isChangingConversationStatus).toBe(false);
    });
  });

  describe('muteConversation.fulfilled', () => {
    it('should set conversation.muted = true', () => {
      const conversation = aConversation().withId(1).withMuted(false).build();
      const initialState = stateWithConversation(conversation);
      const action = {
        type: conversationActions.muteConversation.fulfilled.type,
        payload: { conversationId: 1 },
      };

      const state = reducer(initialState, action);

      expect(state.entities[1]?.muted).toBe(true);
    });
  });

  describe('unmuteConversation.fulfilled', () => {
    it('should set conversation.muted = false', () => {
      const conversation = aConversation().withId(1).withMuted(true).build();
      const initialState = stateWithConversation(conversation);
      const action = {
        type: conversationActions.unmuteConversation.fulfilled.type,
        payload: { conversationId: 1 },
      };

      const state = reducer(initialState, action);

      expect(state.entities[1]?.muted).toBe(false);
    });
  });

  describe('markMessagesUnread.fulfilled', () => {
    it('should update unreadCount and agentLastSeenAt', () => {
      const conversation = aConversation().withId(1).withUnreadCount(0).build();
      const initialState = stateWithConversation(conversation);
      const action = {
        type: conversationActions.markMessagesUnread.fulfilled.type,
        payload: { conversationId: 1, unreadCount: 3, agentLastSeenAt: 1750000000 },
      };

      const state = reducer(initialState, action);

      expect(state.entities[1]?.unreadCount).toBe(3);
      expect(state.entities[1]?.agentLastSeenAt).toBe(1750000000);
    });
  });

  describe('markMessageRead.fulfilled', () => {
    it('should update unreadCount and agentLastSeenAt', () => {
      const conversation = aConversation().withId(1).withUnreadCount(5).build();
      const initialState = stateWithConversation(conversation);
      const action = {
        type: conversationActions.markMessageRead.fulfilled.type,
        payload: { conversationId: 1, agentLastSeenAt: 1800000000, unreadCount: 0 },
      };

      const state = reducer(initialState, action);

      expect(state.entities[1]?.unreadCount).toBe(0);
      expect(state.entities[1]?.agentLastSeenAt).toBe(1800000000);
    });
  });

  describe('assignConversation.fulfilled', () => {
    it('should update conversation.meta.assignee from payload', () => {
      const conversation = aConversation().withId(42).build();
      const initialState = stateWithConversation(conversation);
      const newAssignee = { id: 99, name: 'New Agent' };
      const action = {
        type: conversationActions.assignConversation.fulfilled.type,
        payload: newAssignee,
        meta: { arg: { conversationId: 42, assigneeId: 99 } },
      };

      const state = reducer(initialState, action);

      expect(state.entities[42]?.meta.assignee).toEqual(newAssignee);
    });
  });

  describe('togglePriority.fulfilled', () => {
    it('should update conversation.priority from action.meta.arg', () => {
      const conversation = aConversation().withId(1).withPriority(null).build();
      const initialState = stateWithConversation(conversation);
      const action = {
        type: conversationActions.togglePriority.fulfilled.type,
        payload: undefined,
        meta: { arg: { conversationId: 1, priority: 'urgent' } },
      };

      const state = reducer(initialState, action);

      expect(state.entities[1]?.priority).toBe('urgent');
    });
  });
});
