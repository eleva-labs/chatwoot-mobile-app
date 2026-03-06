import { describe, it, expect } from '@jest/globals';
import { aConversation, aMessage, anAgent } from '@/__tests__/helpers/builders';
import type { Conversation } from '@domain/types/Conversation';
import type { Agent } from '@domain/types/Agent';
import type { RootState } from '@application/store';
import type { FilterState } from '@application/store/conversation/conversationFilterSlice';
import { shouldApplyFilters } from '@infrastructure/utils/conversationUtils';

import {
  selectAllConversations,
  selectConversationById,
  selectConversationsLoading,
  selectConversationError,
  selectConversationFetching,
  selectIsAllConversationsFetched,
  selectIsAllMessagesFetched,
  selectIsLoadingMessages,
  getFilteredConversations,
  getMessagesByConversationId,
  getLastEmailInSelectedChat,
} from '../conversationSelectors';

jest.mock('@infrastructure/utils/conversationUtils', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual('@infrastructure/utils/conversationUtils');
  return {
    ...actual,
    shouldApplyFilters: jest.fn().mockImplementation(actual.shouldApplyFilters),
  };
});
const mockShouldApplyFilters = shouldApplyFilters as jest.MockedFunction<typeof shouldApplyFilters>;

const createConversationsState = (
  conversations: Conversation[],
  overrides: Record<string, unknown> = {},
) => ({
  conversations: {
    ids: conversations.map(c => c.id),
    entities: Object.fromEntries(conversations.map(c => [c.id, c])),
    meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
    error: null,
    isLoadingConversations: false,
    isAllConversationsFetched: false,
    isLoadingMessages: false,
    isAllMessagesFetched: false,
    isConversationFetching: false,
    isChangingConversationStatus: false,
    ...overrides,
  },
});

const defaultFilters: FilterState = {
  assignee_type: 'all',
  status: 'open',
  sort_by: 'latest',
  inbox_id: '0',
};

describe('conversationSelectors', () => {
  beforeEach(() => {
    // Restore real implementation after jest.clearAllMocks() in global afterEach
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const actual = jest.requireActual('@infrastructure/utils/conversationUtils');
    mockShouldApplyFilters.mockImplementation(actual.shouldApplyFilters);
  });

  describe('simple selectors', () => {
    it('selectAllConversations returns all conversations', () => {
      const conv1 = aConversation().withId(1).build();
      const conv2 = aConversation().withId(2).build();
      const state = createConversationsState([conv1, conv2]);

      const result = selectAllConversations(state as unknown as RootState);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([conv1, conv2]));
    });

    it('selectConversationById returns conversation by ID', () => {
      const conv = aConversation().withId(42).build();
      const state = createConversationsState([conv]);

      const result = selectConversationById(state as unknown as RootState, 42);

      expect(result).toEqual(conv);
    });

    it('selectConversationById returns undefined for missing ID', () => {
      const state = createConversationsState([]);

      const result = selectConversationById(state as unknown as RootState, 999);

      expect(result).toBeUndefined();
    });

    it('selectConversationsLoading returns isLoadingConversations flag', () => {
      const state = createConversationsState([], { isLoadingConversations: true });

      const result = selectConversationsLoading(state as unknown as RootState);

      expect(result).toBe(true);
    });

    it('selectConversationError returns error string', () => {
      const state = createConversationsState([], { error: 'Something went wrong' });

      const result = selectConversationError(state as unknown as RootState);

      expect(result).toBe('Something went wrong');
    });

    it('selectConversationFetching returns isConversationFetching flag', () => {
      const state = createConversationsState([], { isConversationFetching: true });

      const result = selectConversationFetching(state as unknown as RootState);

      expect(result).toBe(true);
    });

    it('selectIsAllConversationsFetched returns the flag', () => {
      const state = createConversationsState([], { isAllConversationsFetched: true });

      const result = selectIsAllConversationsFetched(state as unknown as RootState);

      expect(result).toBe(true);
    });

    it('selectIsAllMessagesFetched returns the flag', () => {
      const state = createConversationsState([], { isAllMessagesFetched: true });

      const result = selectIsAllMessagesFetched(state as unknown as RootState);

      expect(result).toBe(true);
    });

    it('selectIsLoadingMessages returns the flag', () => {
      const state = createConversationsState([], { isLoadingMessages: true });

      const result = selectIsLoadingMessages(state as unknown as RootState);

      expect(result).toBe(true);
    });
  });

  describe('getFilteredConversations', () => {
    it('sorts by latest (descending lastActivityAt)', () => {
      const conv1 = aConversation().withId(1).withLastActivityAt(1000).build();
      const conv2 = aConversation().withId(2).withLastActivityAt(3000).build();
      const conv3 = aConversation().withId(3).withLastActivityAt(2000).build();
      const state = createConversationsState([conv1, conv2, conv3]);
      const filters: FilterState = { ...defaultFilters, sort_by: 'latest' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result.map(c => c.id)).toEqual([2, 3, 1]);
    });

    it('sorts by sort_on_created_at (ascending createdAt)', () => {
      const conv1 = aConversation().withId(1).withCreatedAt(3000).build();
      const conv2 = aConversation().withId(2).withCreatedAt(1000).build();
      const conv3 = aConversation().withId(3).withCreatedAt(2000).build();
      const state = createConversationsState([conv1, conv2, conv3]);
      const filters: FilterState = { ...defaultFilters, sort_by: 'sort_on_created_at' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result.map(c => c.id)).toEqual([2, 3, 1]);
    });

    it('sorts by sort_on_priority using CONVERSATION_PRIORITY_ORDER', () => {
      const conv1 = aConversation().withId(1).withPriority('low').build();
      const conv2 = aConversation().withId(2).withPriority('urgent').build();
      const conv3 = aConversation().withId(3).withPriority('high').build();
      const state = createConversationsState([conv1, conv2, conv3]);
      const filters: FilterState = { ...defaultFilters, sort_by: 'sort_on_priority' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result.map(c => c.id)).toEqual([2, 3, 1]);
    });

    it('defaults to latest sort for invalid sortBy value', () => {
      const conv1 = aConversation().withId(1).withLastActivityAt(1000).build();
      const conv2 = aConversation().withId(2).withLastActivityAt(3000).build();
      const state = createConversationsState([conv1, conv2]);
      const filters: FilterState = { ...defaultFilters, sort_by: 'invalid_sort' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result.map(c => c.id)).toEqual([2, 1]);
    });

    it('filters assignee_type "me" to only conversations assigned to userId', () => {
      const myConv = aConversation().withId(1).withAssignee(anAgent().withId(10).build()).build();
      const otherConv = aConversation()
        .withId(2)
        .withAssignee(anAgent().withId(20).build())
        .build();
      const state = createConversationsState([myConv, otherConv]);
      const filters: FilterState = { ...defaultFilters, assignee_type: 'me' };

      const result = getFilteredConversations(state as unknown as RootState, filters, 10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('filters assignee_type "unassigned" to only conversations with no assignee', () => {
      const assignedConv = aConversation()
        .withId(1)
        .withAssignee(anAgent().withId(10).build())
        .build();
      const unassignedConv = aConversation()
        .withId(2)
        .withMeta({
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
            type: 'contact' as const,
          },
          assignee: null as unknown as Agent,
          team: null,
          hmacVerified: null,
          channel: 'Channel::WebWidget',
        })
        .build();
      const state = createConversationsState([assignedConv, unassignedConv]);
      const filters: FilterState = { ...defaultFilters, assignee_type: 'unassigned' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('filters assignee_type "all" returns all conversations matching status filter', () => {
      const openConv = aConversation().withId(1).withStatus('open').build();
      const resolvedConv = aConversation().withId(2).withStatus('resolved').build();
      const state = createConversationsState([openConv, resolvedConv]);
      const filters: FilterState = { ...defaultFilters, assignee_type: 'all', status: 'open' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should exclude conversations when shouldApplyFilters returns false', () => {
      const conv1 = aConversation().withId(1).withLastActivityAt(3000).build();
      const conv2 = aConversation().withId(2).withLastActivityAt(2000).build();
      const state = createConversationsState([conv1, conv2]);
      const filters: FilterState = { ...defaultFilters, assignee_type: 'all' };
      mockShouldApplyFilters.mockImplementation(conv => (conv as { id: number }).id === 1);

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should treat null priority as lowest when sorting by priority', () => {
      const convWithPriority = aConversation().withId(1).withPriority('urgent').build();
      const convNullPriority = aConversation().withId(2).withPriority(null).build();
      const state = createConversationsState([convNullPriority, convWithPriority]);
      const filters: FilterState = { ...defaultFilters, sort_by: 'sort_on_priority' };

      const result = getFilteredConversations(state as unknown as RootState, filters, undefined);

      expect(result.map(c => c.id)).toEqual([1, 2]);
    });
  });

  describe('getMessagesByConversationId', () => {
    it('returns messages sorted by createdAt descending and deduplicated', () => {
      const msg1 = aMessage().withId(1).withCreatedAt(1000).build();
      const msg2 = aMessage().withId(2).withCreatedAt(3000).build();
      const msg3 = aMessage().withId(3).withCreatedAt(2000).build();
      const duplicateMsg1 = aMessage().withId(1).withCreatedAt(1000).build();
      const conv = aConversation()
        .withId(1)
        .withMessages([msg1, msg2, msg3, duplicateMsg1])
        .build();
      const state = createConversationsState([conv]);

      const result = getMessagesByConversationId(state as unknown as RootState, {
        conversationId: 1,
      });

      expect(result).toHaveLength(3);
      expect(result.map(m => m.id)).toEqual([2, 3, 1]);
    });

    it('returns empty array for missing conversation', () => {
      const state = createConversationsState([]);

      const result = getMessagesByConversationId(state as unknown as RootState, {
        conversationId: 999,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getLastEmailInSelectedChat', () => {
    it('returns last email message with from field', () => {
      const regularMsg = aMessage().withId(1).withCreatedAt(1000).withMessageType(0).build();

      const emailMsg = aMessage()
        .withId(2)
        .withCreatedAt(2000)
        .withMessageType(1)
        .withContentAttributes({
          email: { from: ['sender@example.com'], subject: 'Test' },
        })
        .build();

      const conv = aConversation().withId(1).withMessages([regularMsg, emailMsg]).build();
      const state = createConversationsState([conv]);

      const result = getLastEmailInSelectedChat(state as unknown as RootState, {
        conversationId: 1,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(2);
    });

    it('returns null when no email messages exist', () => {
      const regularMsg = aMessage().withId(1).withMessageType(0).build();
      const conv = aConversation().withId(1).withMessages([regularMsg]).build();
      const state = createConversationsState([conv]);

      const result = getLastEmailInSelectedChat(state as unknown as RootState, {
        conversationId: 1,
      });

      expect(result).toBeNull();
    });

    it('returns null for missing conversation', () => {
      const state = createConversationsState([]);

      const result = getLastEmailInSelectedChat(state as unknown as RootState, {
        conversationId: 999,
      });

      expect(result).toBeNull();
    });
  });
});
