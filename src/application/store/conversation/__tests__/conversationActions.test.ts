import { configureStore } from '@reduxjs/toolkit';
import conversationReducer from '../conversationSlice';
import { conversationActions } from '../conversationActions';
import { ConversationService } from '../conversationService';
import { aConversation } from '@/__tests__/helpers/builders';
import { MESSAGE_STATUS } from '@domain/constants';
import { createPendingMessage, buildCreatePayload } from '@infrastructure/utils/messageUtils';

// ─── Service Layer Mock ──────────────────────────────────────────
jest.mock('../conversationService');
const mockService = ConversationService as jest.Mocked<typeof ConversationService>;

// ─── Utility Mocks ───────────────────────────────────────────────
jest.mock('@infrastructure/utils/messageUtils', () => ({
  createPendingMessage: jest.fn(),
  buildCreatePayload: jest.fn(),
}));
const mockCreatePendingMessage = createPendingMessage as jest.MockedFunction<
  typeof createPendingMessage
>;
const mockBuildCreatePayload = buildCreatePayload as jest.MockedFunction<typeof buildCreatePayload>;

jest.mock('@infrastructure/utils/camelCaseKeys', () => ({
  transformMessage: jest.fn((msg: Record<string, unknown>) => ({
    ...msg,
    conversationId: msg.conversation_id,
    messageType: msg.message_type,
    contentType: msg.content_type,
    createdAt: msg.created_at,
    echoId: msg.echo_id,
    inboxId: msg.inbox_id,
    sourceId: msg.source_id,
  })),
}));

jest.mock('@infrastructure/utils/conversationUtils', () => ({
  findPendingMessageIndex: jest.fn().mockReturnValue(-1),
  shouldApplyFilters: jest.fn().mockReturnValue(true),
}));

// ─── Store Factory ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStore = (preloadedState?: any) =>
  configureStore({
    reducer: { conversations: conversationReducer },
    ...(preloadedState && { preloadedState }),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

// ─── Test Data ───────────────────────────────────────────────────
const makeSendMessagePayload = (overrides = {}) => ({
  conversationId: 1,
  message: 'Hello world',
  private: false,
  sender: { id: 42, name: 'Agent Smith' },
  ...overrides,
});

const makePendingMessage = (payload: ReturnType<typeof makeSendMessagePayload>) => ({
  ...payload,
  content: payload.message,
  id: 'temp-uuid-123',
  echoId: 'temp-uuid-123',
  status: MESSAGE_STATUS.PROGRESS as typeof MESSAGE_STATUS.PROGRESS,
  createdAt: 1700000000,
  messageType: 1 as const,
  attachments: null,
});

const makeApiResponse = () => ({
  id: 100,
  content: 'Hello world',
  inbox_id: 1,
  echo_id: 'temp-uuid-123',
  conversation_id: 1,
  message_type: 1,
  content_type: 'text',
  status: 'sent',
  created_at: 1700000000,
  private: false,
  source_id: null,
  sender: {
    id: 42,
    name: 'Agent Smith',
    available_name: 'Agent Smith',
    avatar_url: '',
    type: 'user',
    availability_status: 'online',
    thumbnail: '',
  },
});

// ─── Tests ───────────────────────────────────────────────────────
describe('conversationActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // fetchConversations
  // ─────────────────────────────────────────────────────────────
  describe('fetchConversations', () => {
    const fetchPayload = {
      page: 1,
      status: 'open' as const,
      assigneeType: 'me' as const,
      sortBy: 'latest' as const,
    };

    it('should call service and return conversations on success', async () => {
      const conversations = [aConversation().withId(1).build(), aConversation().withId(2).build()];
      const meta = { mineCount: 5, unassignedCount: 3, allCount: 10 };
      const serviceResponse = { conversations, meta };
      mockService.getConversations.mockResolvedValue(serviceResponse);

      const store = createStore();
      const result = await store.dispatch(conversationActions.fetchConversations(fetchPayload));

      expect(result.type).toBe('conversations/fetchConversations/fulfilled');
      expect(result.payload).toEqual(serviceResponse);
      expect(mockService.getConversations).toHaveBeenCalledWith(fetchPayload);

      const state = store.getState().conversations;
      expect(state.ids).toContain(1);
      expect(state.ids).toContain(2);
      expect(state.meta).toEqual(meta);
      expect(state.isLoadingConversations).toBe(false);
    });

    it('should reject with response.data when API returns an error response', async () => {
      const errorData = { success: false, errors: ['Unauthorized'] };
      const axiosError = { response: { data: errorData } };
      mockService.getConversations.mockRejectedValue(axiosError);

      const store = createStore();
      const result = await store.dispatch(conversationActions.fetchConversations(fetchPayload));

      expect(result.type).toBe('conversations/fetchConversations/rejected');
      expect(result.payload).toEqual(errorData);
    });

    it('should throw when error has no response (network error)', async () => {
      const networkError = new Error('Network Error');
      mockService.getConversations.mockRejectedValue(networkError);

      const store = createStore();
      const result = await store.dispatch(conversationActions.fetchConversations(fetchPayload));

      expect(result.type).toBe('conversations/fetchConversations/rejected');
      // When error is thrown (not rejectWithValue), payload is undefined
      expect(result.payload).toBeUndefined();
      expect((result as { error: { message: string } }).error.message).toBe('Network Error');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // fetchConversation
  // ─────────────────────────────────────────────────────────────
  describe('fetchConversation', () => {
    it('should fetch a single conversation and upsert to store', async () => {
      const conversation = aConversation().withId(7).build();
      mockService.fetchConversation.mockResolvedValue({ conversation });

      const store = createStore();
      const result = await store.dispatch(conversationActions.fetchConversation(7));

      expect(result.type).toBe('conversations/fetchConversation/fulfilled');
      expect(result.payload).toEqual({ conversation });
      expect(mockService.fetchConversation).toHaveBeenCalledWith(7);

      const state = store.getState().conversations;
      expect(state.entities[7]).toBeDefined();
      expect(state.isConversationFetching).toBe(false);
    });

    it('should reject with response.data on API error', async () => {
      const errorData = { success: false, errors: ['Not Found'] };
      const axiosError = { response: { data: errorData } };
      mockService.fetchConversation.mockRejectedValue(axiosError);

      const store = createStore();
      const result = await store.dispatch(conversationActions.fetchConversation(999));

      expect(result.type).toBe('conversations/fetchConversation/rejected');
      expect(result.payload).toEqual(errorData);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // sendMessage — Optimistic update lifecycle
  // ─────────────────────────────────────────────────────────────
  describe('sendMessage', () => {
    const sendPayload = makeSendMessagePayload();

    it('should result in a sent message in the store on success', async () => {
      const pendingMsg = makePendingMessage(sendPayload);
      const apiResponse = makeApiResponse();
      const builtPayload = { content: 'Hello world', private: false, echo_id: 'temp-uuid-123' };

      mockCreatePendingMessage.mockReturnValue(pendingMsg);
      mockBuildCreatePayload.mockReturnValue(builtPayload);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockService.sendMessage.mockResolvedValue(apiResponse as any);

      // Create store with conversation that has conversationId=1
      const conversation = aConversation().withId(1).withMessages([]).build();
      const store = createStore({
        conversations: {
          ids: [1],
          entities: { 1: conversation },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
          error: null,
          isLoadingConversations: false,
          isAllConversationsFetched: false,
          isLoadingMessages: false,
          isAllMessagesFetched: false,
          isConversationFetching: false,
          isChangingConversationStatus: false,
        },
      });

      const result = await store.dispatch(conversationActions.sendMessage(sendPayload));

      expect(result.type).toBe('conversations/sendMessage/fulfilled');
      expect(mockService.sendMessage).toHaveBeenCalledWith(1, builtPayload, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Verify final state: conversation should have the sent message
      const state = store.getState().conversations;
      const messages = state.entities[1]?.messages ?? [];
      expect(messages.length).toBeGreaterThanOrEqual(1);
      // The last message should have 'sent' status (the confirmed message replaces or follows the pending one)
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.status).toBe(MESSAGE_STATUS.SENT);
    });

    it('should call ConversationService.sendMessage with correct params', async () => {
      const pendingMsg = makePendingMessage(sendPayload);
      const builtPayload = { content: 'Hello world', private: false, echo_id: 'temp-uuid-123' };
      mockCreatePendingMessage.mockReturnValue(pendingMsg);
      mockBuildCreatePayload.mockReturnValue(builtPayload);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockService.sendMessage.mockResolvedValue(makeApiResponse() as any);

      const store = createStore();
      await store.dispatch(conversationActions.sendMessage(sendPayload));

      expect(mockService.sendMessage).toHaveBeenCalledWith(1, builtPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should result in a failed message in the store when API returns error response', async () => {
      const pendingMsg = makePendingMessage(sendPayload);
      mockCreatePendingMessage.mockReturnValue(pendingMsg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockBuildCreatePayload.mockReturnValue({} as any);

      const errorData = { success: false, errors: ['Message too long'] };
      const axiosError = { response: { data: errorData } };
      mockService.sendMessage.mockRejectedValue(axiosError);

      const conversation = aConversation().withId(1).withMessages([]).build();
      const store = createStore({
        conversations: {
          ids: [1],
          entities: { 1: conversation },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
          error: null,
          isLoadingConversations: false,
          isAllConversationsFetched: false,
          isLoadingMessages: false,
          isAllMessagesFetched: false,
          isConversationFetching: false,
          isChangingConversationStatus: false,
        },
      });

      const result = await store.dispatch(conversationActions.sendMessage(sendPayload));

      expect(result.type).toBe('conversations/sendMessage/rejected');
      expect(result.payload).toEqual(errorData);

      // Verify final state: message should be failed
      const state = store.getState().conversations;
      const messages = state.entities[1]?.messages ?? [];
      expect(messages.length).toBeGreaterThanOrEqual(1);
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.status).toBe(MESSAGE_STATUS.FAILED);
    });

    it('should use multipart/form-data Content-Type when file is present in payload', async () => {
      const filePayload = makeSendMessagePayload({
        file: { uri: 'file://photo.jpg', fileName: 'photo.jpg', type: 'image/jpeg' },
      });
      const pendingMsg = makePendingMessage(filePayload);
      const builtPayload = { content: 'Hello world', private: false, echo_id: 'temp-uuid-123' };
      mockCreatePendingMessage.mockReturnValue(pendingMsg);
      mockBuildCreatePayload.mockReturnValue(builtPayload);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockService.sendMessage.mockResolvedValue(makeApiResponse() as any);

      const store = createStore();
      await store.dispatch(conversationActions.sendMessage(filePayload));

      // Content-Type should be 'multipart/form-data', NOT the file's MIME type ('image/jpeg')
      expect(mockService.sendMessage).toHaveBeenCalledWith(1, builtPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should result in a failed message and throw when error has no response (network error)', async () => {
      const pendingMsg = makePendingMessage(sendPayload);
      mockCreatePendingMessage.mockReturnValue(pendingMsg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockBuildCreatePayload.mockReturnValue({} as any);

      const networkError = new Error('Network Error');
      mockService.sendMessage.mockRejectedValue(networkError);

      const conversation = aConversation().withId(1).withMessages([]).build();
      const store = createStore({
        conversations: {
          ids: [1],
          entities: { 1: conversation },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
          error: null,
          isLoadingConversations: false,
          isAllConversationsFetched: false,
          isLoadingMessages: false,
          isAllMessagesFetched: false,
          isConversationFetching: false,
          isChangingConversationStatus: false,
        },
      });

      const result = await store.dispatch(conversationActions.sendMessage(sendPayload));

      expect(result.type).toBe('conversations/sendMessage/rejected');
      expect(result.payload).toBeUndefined();
      expect((result as { error: { message: string } }).error.message).toBe('Network Error');

      // Verify final state: message should be failed
      const state = store.getState().conversations;
      const messages = state.entities[1]?.messages ?? [];
      expect(messages.length).toBeGreaterThanOrEqual(1);
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.status).toBe(MESSAGE_STATUS.FAILED);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // toggleConversationStatus
  // ─────────────────────────────────────────────────────────────
  describe('toggleConversationStatus', () => {
    it('should return conversationId, currentStatus, and snoozedUntil on success', async () => {
      const togglePayload = {
        conversationId: 1,
        payload: { status: 'resolved' as const, snoozed_until: null },
      };
      const serviceResponse = {
        conversationId: 1,
        currentStatus: 'resolved' as const,
        snoozedUntil: null,
      };
      mockService.toggleConversationStatus.mockResolvedValue(serviceResponse);

      const conversation = aConversation().withId(1).withStatus('open').build();
      const store = createStore({
        conversations: {
          ids: [1],
          entities: { 1: conversation },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
          error: null,
          isLoadingConversations: false,
          isAllConversationsFetched: false,
          isLoadingMessages: false,
          isAllMessagesFetched: false,
          isConversationFetching: false,
          isChangingConversationStatus: false,
        },
      });

      const result = await store.dispatch(
        conversationActions.toggleConversationStatus(togglePayload),
      );

      expect(result.type).toBe('conversations/toggleConversationStatus/fulfilled');
      expect(result.payload).toEqual(serviceResponse);
      expect(mockService.toggleConversationStatus).toHaveBeenCalledWith(togglePayload);

      const state = store.getState().conversations;
      expect(state.entities[1]?.status).toBe('resolved');
      expect(state.isChangingConversationStatus).toBe(false);
    });

    it('should reject with response.data on API error', async () => {
      const errorData = { success: false, errors: ['Forbidden'] };
      const axiosError = { response: { data: errorData } };
      mockService.toggleConversationStatus.mockRejectedValue(axiosError);

      const store = createStore();
      const result = await store.dispatch(
        conversationActions.toggleConversationStatus({
          conversationId: 1,
          payload: { status: 'resolved', snoozed_until: null },
        }),
      );

      expect(result.type).toBe('conversations/toggleConversationStatus/rejected');
      expect(result.payload).toEqual(errorData);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // muteConversation
  // ─────────────────────────────────────────────────────────────
  describe('muteConversation', () => {
    it('should call service and return { conversationId } on success', async () => {
      mockService.muteConversation.mockResolvedValue(undefined);

      const conversation = aConversation().withId(5).withMuted(false).build();
      const store = createStore({
        conversations: {
          ids: [5],
          entities: { 5: conversation },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
          error: null,
          isLoadingConversations: false,
          isAllConversationsFetched: false,
          isLoadingMessages: false,
          isAllMessagesFetched: false,
          isConversationFetching: false,
          isChangingConversationStatus: false,
        },
      });

      const result = await store.dispatch(
        conversationActions.muteConversation({ conversationId: 5 }),
      );

      expect(result.type).toBe('conversations/muteConversation/fulfilled');
      expect(result.payload).toEqual({ conversationId: 5 });
      expect(mockService.muteConversation).toHaveBeenCalledWith({ conversationId: 5 });

      const state = store.getState().conversations;
      expect(state.entities[5]?.muted).toBe(true);
    });

    it('should reject when service throws', async () => {
      mockService.muteConversation.mockRejectedValue(new Error('Server Error'));

      const store = createStore();
      const result = await store.dispatch(
        conversationActions.muteConversation({ conversationId: 5 }),
      );

      expect(result.type).toBe('conversations/muteConversation/rejected');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // unmuteConversation
  // ─────────────────────────────────────────────────────────────
  describe('unmuteConversation', () => {
    it('should call service and return { conversationId } on success', async () => {
      mockService.unmuteConversation.mockResolvedValue(undefined);

      const conversation = aConversation().withId(3).withMuted(true).build();
      const store = createStore({
        conversations: {
          ids: [3],
          entities: { 3: conversation },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
          error: null,
          isLoadingConversations: false,
          isAllConversationsFetched: false,
          isLoadingMessages: false,
          isAllMessagesFetched: false,
          isConversationFetching: false,
          isChangingConversationStatus: false,
        },
      });

      const result = await store.dispatch(
        conversationActions.unmuteConversation({ conversationId: 3 }),
      );

      expect(result.type).toBe('conversations/unmuteConversation/fulfilled');
      expect(result.payload).toEqual({ conversationId: 3 });
      expect(mockService.unmuteConversation).toHaveBeenCalledWith({ conversationId: 3 });

      const state = store.getState().conversations;
      expect(state.entities[3]?.muted).toBe(false);
    });

    it('should reject when service throws', async () => {
      mockService.unmuteConversation.mockRejectedValue(new Error('Server Error'));

      const store = createStore();
      const result = await store.dispatch(
        conversationActions.unmuteConversation({ conversationId: 3 }),
      );

      expect(result.type).toBe('conversations/unmuteConversation/rejected');
    });
  });
});
