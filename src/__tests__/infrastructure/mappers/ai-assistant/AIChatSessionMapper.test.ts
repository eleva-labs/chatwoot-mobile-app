/**
 * Unit Tests for AIChatSessionMapper
 *
 * Tests the AIChatSessionMapper that converts backend session DTOs
 * to domain AIChatSession entities.
 */

import { AIChatSessionMapper } from '@/infrastructure/mappers/ai-assistant/AIChatSessionMapper';
import type { AIChatSessionDTO } from '@/infrastructure/dto/ai-assistant';

describe('AIChatSessionMapper', () => {
  let mapper: AIChatSessionMapper;

  beforeEach(() => {
    jest.clearAllMocks();
    mapper = new AIChatSessionMapper();
  });

  // ============================================================================
  // toAIChatSession Tests - Single Session Mapping
  // ============================================================================

  describe('toAIChatSession', () => {
    it('should map basic session DTO to domain entity', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-123',
        updated_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:00:00Z',
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.id).toBe('session-123');
      expect(result.updatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      expect(result.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });

    it('should map session with agent_bot_id', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-456',
        updated_at: '2024-01-15T10:30:00Z',
        agent_bot_id: 42,
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.agentBotId).toBe(42);
    });

    it('should map session with account_id', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-789',
        updated_at: '2024-01-15T10:30:00Z',
        account_id: 123,
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.accountId).toBe(123);
    });

    it('should map session with all optional fields', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'full-session',
        updated_at: '2024-01-15T12:00:00Z',
        created_at: '2024-01-15T08:00:00Z',
        agent_bot_id: 5,
        account_id: 100,
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.id).toBe('full-session');
      expect(result.agentBotId).toBe(5);
      expect(result.accountId).toBe(100);
      expect(result.createdAt).toEqual(new Date('2024-01-15T08:00:00Z'));
      expect(result.updatedAt).toEqual(new Date('2024-01-15T12:00:00Z'));
    });

    it('should use current date as fallback when created_at is missing', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-no-created',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const beforeTest = new Date();
      const result = mapper.toAIChatSession(dto);
      const afterTest = new Date();

      // createdAt should be approximately now
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });

    it('should correctly parse updated_at date', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-date-test',
        updated_at: '2024-06-20T15:45:30Z',
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.updatedAt.getFullYear()).toBe(2024);
      expect(result.updatedAt.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(result.updatedAt.getDate()).toBe(20);
    });

    it('should handle session with undefined agent_bot_id', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-no-bot',
        updated_at: '2024-01-15T10:30:00Z',
        agent_bot_id: undefined,
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.agentBotId).toBeUndefined();
    });

    it('should handle session with undefined account_id', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: 'session-no-account',
        updated_at: '2024-01-15T10:30:00Z',
        account_id: undefined,
      };

      const result = mapper.toAIChatSession(dto);

      expect(result.accountId).toBeUndefined();
    });

    it('should create branded AIChatSessionId from chat_session_id', () => {
      const dto: AIChatSessionDTO = {
        chat_session_id: '  trimmed-id  ',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const result = mapper.toAIChatSession(dto);

      // The createAIChatSessionId function should trim the input
      expect(result.id).toBe('trimmed-id');
    });
  });

  // ============================================================================
  // toAIChatSessions Tests - Array Mapping
  // ============================================================================

  describe('toAIChatSessions', () => {
    it('should map array of DTOs to domain entities', () => {
      const dtos: AIChatSessionDTO[] = [
        {
          chat_session_id: 'session-1',
          updated_at: '2024-01-15T10:00:00Z',
          agent_bot_id: 1,
        },
        {
          chat_session_id: 'session-2',
          updated_at: '2024-01-15T11:00:00Z',
          agent_bot_id: 2,
        },
      ];

      const result = mapper.toAIChatSessions(dtos);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[1].id).toBe('session-2');
    });

    it('should handle empty array', () => {
      const result = mapper.toAIChatSessions([]);

      expect(result).toEqual([]);
    });

    it('should maintain session order', () => {
      const dtos: AIChatSessionDTO[] = [
        {
          chat_session_id: 'first',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          chat_session_id: 'second',
          updated_at: '2024-01-15T11:00:00Z',
        },
        {
          chat_session_id: 'third',
          updated_at: '2024-01-15T12:00:00Z',
        },
      ];

      const result = mapper.toAIChatSessions(dtos);

      expect(result[0].id).toBe('first');
      expect(result[1].id).toBe('second');
      expect(result[2].id).toBe('third');
    });

    it('should correctly map each session in the array', () => {
      const dtos: AIChatSessionDTO[] = [
        {
          chat_session_id: 'session-a',
          updated_at: '2024-01-15T10:00:00Z',
          agent_bot_id: 10,
          account_id: 100,
        },
        {
          chat_session_id: 'session-b',
          updated_at: '2024-01-15T11:00:00Z',
          agent_bot_id: 20,
          account_id: 200,
        },
      ];

      const result = mapper.toAIChatSessions(dtos);

      expect(result[0].agentBotId).toBe(10);
      expect(result[0].accountId).toBe(100);
      expect(result[1].agentBotId).toBe(20);
      expect(result[1].accountId).toBe(200);
    });
  });
});
