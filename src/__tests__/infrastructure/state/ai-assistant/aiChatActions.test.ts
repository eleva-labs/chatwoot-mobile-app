/**
 * Unit Tests for aiChatActions
 *
 * Tests the Redux async thunks for AI chat operations.
 * These actions use the AIAssistantFactory and use cases for Clean Architecture.
 */

// Mock the factory module before imports
jest.mock('@/presentation/factory/ai-assistant', () => ({
  getDefaultAIAssistantDependencies: jest.fn(),
}));

// Mock dependency-injection to prevent import chain issues
jest.mock('@/dependency-injection', () => ({
  resolve: jest.fn(),
}));

// Mock the tokens
jest.mock('@/dependency-injection/tokens', () => ({
  AI_ASSISTANT_TOKENS: {
    IAIChatApiService: Symbol('IAIChatApiService'),
  },
}));

import { configureStore } from '@reduxjs/toolkit';
import { aiChatActions } from '@/infrastructure/state/ai-assistant/aiChatActions';
import * as factoryModule from '@/presentation/factory/ai-assistant';
import { Result } from '@/domain/shared/Result';
import { createAIChatSessionId } from '@/domain/value-objects/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';

describe('aiChatActions', () => {
  // Mock use cases
  const mockFetchSessionsUseCase = { execute: jest.fn() };
  const mockLoadMessagesUseCase = { execute: jest.fn() };
  const mockCreateSessionUseCase = { execute: jest.fn() };
  const mockDeleteSessionUseCase = { execute: jest.fn() };

  // Sample data
  const mockDomainSessions: AIChatSession[] = [
    {
      id: createAIChatSessionId('session-1'),
      agentBotId: 1,
      accountId: 123,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: createAIChatSessionId('session-2'),
      agentBotId: 1,
      accountId: 123,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      updatedAt: new Date('2024-01-15T11:30:00Z'),
    },
  ];

  // Create a minimal store for testing thunks
  const createTestStore = () =>
    configureStore({
      reducer: {
        aiChat: (state = {}) => state,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (factoryModule.getDefaultAIAssistantDependencies as jest.Mock).mockReturnValue({
      fetchSessionsUseCase: mockFetchSessionsUseCase,
      loadMessagesUseCase: mockLoadMessagesUseCase,
      createSessionUseCase: mockCreateSessionUseCase,
      deleteSessionUseCase: mockDeleteSessionUseCase,
    });
  });

  // ============================================================================
  // fetchSessions Tests
  // ============================================================================

  describe('fetchSessions', () => {
    it('should call fetchSessionsUseCase for Rails proxy when agentBotId provided', async () => {
      mockFetchSessionsUseCase.execute.mockResolvedValue(Result.ok(mockDomainSessions));
      const store = createTestStore();

      await store.dispatch(aiChatActions.fetchSessions({ agentBotId: 1, limit: 25 }));

      expect(mockFetchSessionsUseCase.execute).toHaveBeenCalledWith({
        agentBotId: 1,
        limit: 25,
        offset: undefined,
      });
    });

    it('should return sessions with correct key format agentBot_{id}', async () => {
      mockFetchSessionsUseCase.execute.mockResolvedValue(Result.ok(mockDomainSessions));
      const store = createTestStore();

      const result = await store.dispatch(aiChatActions.fetchSessions({ agentBotId: 5 }));

      expect(result.payload).toMatchObject({
        key: 'agentBot_5',
      });
    });

    it('should map domain entities to DTO format for Redux state', async () => {
      mockFetchSessionsUseCase.execute.mockResolvedValue(Result.ok(mockDomainSessions));
      const store = createTestStore();

      const result = await store.dispatch(aiChatActions.fetchSessions({ agentBotId: 1 }));

      const payload = result.payload as { sessions: unknown[]; key: string };
      expect(payload.sessions).toHaveLength(2);
      expect(payload.sessions[0]).toMatchObject({
        chat_session_id: 'session-1',
        agent_bot_id: 1,
        account_id: 123,
      });
    });

    it('should reject with error on use case failure', async () => {
      const error = new Error('Network error');
      mockFetchSessionsUseCase.execute.mockResolvedValue(Result.fail(error));
      const store = createTestStore();

      const result = await store.dispatch(aiChatActions.fetchSessions({ agentBotId: 1 }));

      expect(result.type).toContain('rejected');
      expect((result.payload as { message: string }).message).toBe('Network error');
    });
  });

  // ============================================================================
  // fetchMessages Tests
  // ============================================================================

  describe('fetchMessages', () => {
    const mockUIMessages = [
      {
        id: 'msg-1',
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: 'Hello' }],
      },
      {
        id: 'msg-2',
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: 'Hi there!' }],
      },
    ];

    it('should call loadMessagesUseCase for Rails proxy', async () => {
      mockLoadMessagesUseCase.execute.mockResolvedValue(Result.ok(mockUIMessages));
      const store = createTestStore();

      await store.dispatch(aiChatActions.fetchMessages({ sessionId: 'session-123' }));

      expect(mockLoadMessagesUseCase.execute).toHaveBeenCalled();
    });

    it('should map UIMessages to DTO format for Redux', async () => {
      mockLoadMessagesUseCase.execute.mockResolvedValue(Result.ok(mockUIMessages));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.fetchMessages({ sessionId: 'session-123' }),
      );

      const payload = result.payload as { messages: unknown[]; sessionId: string };
      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[0]).toMatchObject({
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
      });
    });

    it('should filter text parts correctly when mapping', async () => {
      const messagesWithMixedParts = [
        {
          id: 'msg-mixed',
          role: 'assistant' as const,
          parts: [
            { type: 'text' as const, text: 'Part 1' },
            { type: 'reasoning' as const, text: 'thinking...' },
            { type: 'text' as const, text: 'Part 2' },
          ],
        },
      ];
      mockLoadMessagesUseCase.execute.mockResolvedValue(Result.ok(messagesWithMixedParts));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.fetchMessages({ sessionId: 'session-123' }),
      );

      const payload = result.payload as { messages: { content: string }[] };
      // Should only include text from text parts
      expect(payload.messages[0].content).toBe('Part 1Part 2');
    });

    it('should reject on use case failure', async () => {
      const error = new Error('Failed to load messages');
      mockLoadMessagesUseCase.execute.mockResolvedValue(Result.fail(error));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.fetchMessages({ sessionId: 'session-123' }),
      );

      expect(result.type).toContain('rejected');
    });
  });

  // ============================================================================
  // createSession Tests
  // ============================================================================

  describe('createSession', () => {
    const mockCreatedSession: AIChatSession = {
      id: createAIChatSessionId('new-session-123'),
      agentBotId: 1,
      accountId: 123,
      createdAt: new Date('2024-01-15T12:00:00Z'),
      updatedAt: new Date('2024-01-15T12:00:00Z'),
    };

    it('should call createSessionUseCase with agentBotId', async () => {
      mockCreateSessionUseCase.execute.mockResolvedValue(Result.ok(mockCreatedSession));
      const store = createTestStore();

      await store.dispatch(aiChatActions.createSession({ agentBotId: 1 }));

      expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith({
        agentBotId: 1,
        initialMessage: undefined,
      });
    });

    it('should include optional initialMessage', async () => {
      mockCreateSessionUseCase.execute.mockResolvedValue(Result.ok(mockCreatedSession));
      const store = createTestStore();

      await store.dispatch(
        aiChatActions.createSession({ agentBotId: 1, initialMessage: 'Hello!' }),
      );

      expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith({
        agentBotId: 1,
        initialMessage: 'Hello!',
      });
    });

    it('should map domain session to DTO format', async () => {
      mockCreateSessionUseCase.execute.mockResolvedValue(Result.ok(mockCreatedSession));
      const store = createTestStore();

      const result = await store.dispatch(aiChatActions.createSession({ agentBotId: 1 }));

      const payload = result.payload as { session: unknown; key: string };
      expect(payload.session).toMatchObject({
        chat_session_id: 'new-session-123',
        agent_bot_id: 1,
        account_id: 123,
      });
    });

    it('should return session with correct key format', async () => {
      mockCreateSessionUseCase.execute.mockResolvedValue(Result.ok(mockCreatedSession));
      const store = createTestStore();

      const result = await store.dispatch(aiChatActions.createSession({ agentBotId: 7 }));

      const payload = result.payload as { key: string };
      expect(payload.key).toBe('agentBot_7');
    });
  });

  // ============================================================================
  // deleteSession Tests
  // ============================================================================

  describe('deleteSession', () => {
    it('should call deleteSessionUseCase with chatSessionId', async () => {
      mockDeleteSessionUseCase.execute.mockResolvedValue(Result.ok(undefined));
      const store = createTestStore();

      await store.dispatch(aiChatActions.deleteSession({ sessionId: 'session-to-delete' }));

      expect(mockDeleteSessionUseCase.execute).toHaveBeenCalled();
    });

    it('should return sessionId and key on success', async () => {
      mockDeleteSessionUseCase.execute.mockResolvedValue(Result.ok(undefined));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.deleteSession({ sessionId: 'session-123', agentBotId: 1 }),
      );

      expect(result.payload).toMatchObject({
        sessionId: 'session-123',
        key: 'agentBot_1',
      });
    });

    it('should determine correct key from agentBotId', async () => {
      mockDeleteSessionUseCase.execute.mockResolvedValue(Result.ok(undefined));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.deleteSession({ sessionId: 'session-123', agentBotId: 42 }),
      );

      expect((result.payload as { key: string }).key).toBe('agentBot_42');
    });

    it('should use default key when no identifiers provided', async () => {
      mockDeleteSessionUseCase.execute.mockResolvedValue(Result.ok(undefined));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.deleteSession({ sessionId: 'session-123' }),
      );

      expect((result.payload as { key: string }).key).toBe('default');
    });

    it('should reject on failure', async () => {
      const error = new Error('Delete failed');
      mockDeleteSessionUseCase.execute.mockResolvedValue(Result.fail(error));
      const store = createTestStore();

      const result = await store.dispatch(
        aiChatActions.deleteSession({ sessionId: 'session-123' }),
      );

      expect(result.type).toContain('rejected');
    });
  });
});
