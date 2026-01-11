/**
 * Unit Tests for MessageMapper
 *
 * Tests the MessageMapper that converts backend message DTOs
 * to Vercel SDK UIMessage format.
 */

import { MessageMapper } from '@/infrastructure/mappers/ai-assistant/MessageMapper';
import { PART_TYPES } from '@/domain/types/ai-assistant/constants';
import type { AIChatMessageDTO, AIChatMessagePartDTO } from '@/infrastructure/dto/ai-assistant';

describe('MessageMapper', () => {
  let mapper: MessageMapper;

  beforeEach(() => {
    jest.clearAllMocks();
    mapper = new MessageMapper();
  });

  // ============================================================================
  // toUIMessage Tests - Basic Message Mapping
  // ============================================================================

  describe('toUIMessage', () => {
    it('should map basic message DTO with text part', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello world',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: PART_TYPES.TEXT, text: 'Hello world' }],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.id).toBe('msg-1');
      expect(result.role).toBe('assistant');
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({ type: 'text', text: 'Hello world' });
    });

    it('should map message with multiple text parts', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-2',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [
          { type: PART_TYPES.TEXT, text: 'First part' },
          { type: PART_TYPES.TEXT, text: 'Second part' },
        ],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(2);
      expect(result.parts[0]).toEqual({ type: 'text', text: 'First part' });
      expect(result.parts[1]).toEqual({ type: 'text', text: 'Second part' });
    });

    it('should map message with reasoning part', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-3',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: PART_TYPES.REASONING, text: 'Thinking about this...' }],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({
        type: 'reasoning',
        text: 'Thinking about this...',
        state: 'done',
      });
    });

    it('should map tool call part to dynamic-tool input-available', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-4',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [
          {
            type: PART_TYPES.TOOL_CALL,
            toolCallId: 'call-1',
            toolName: 'search',
            args: { query: 'test' },
          },
        ],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toMatchObject({
        type: 'dynamic-tool',
        toolCallId: 'call-1',
        toolName: 'search',
        state: 'input-available',
        input: { query: 'test' },
      });
    });

    it('should map tool result part to dynamic-tool output-available', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-5',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [
          {
            type: PART_TYPES.TOOL_RESULT,
            toolCallId: 'call-1',
            toolName: 'search',
            args: { query: 'test' },
            result: { found: true, data: 'result data' },
          },
        ],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toMatchObject({
        type: 'dynamic-tool',
        toolCallId: 'call-1',
        toolName: 'search',
        state: 'output-available',
        input: { query: 'test' },
        output: { found: true, data: 'result data' },
      });
    });

    it('should use fallbackContent when parts is empty', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-6',
        role: 'user',
        content: 'Fallback text',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({ type: 'text', text: 'Fallback text' });
    });

    it('should use fallbackContent when parts is undefined', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-7',
        role: 'user',
        content: 'Fallback content',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({ type: 'text', text: 'Fallback content' });
    });

    it('should set correct role from DTO (user)', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-8',
        role: 'user',
        content: 'User message',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: PART_TYPES.TEXT, text: 'User message' }],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.role).toBe('user');
    });

    it('should set correct role from DTO (system)', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-9',
        role: 'system',
        content: 'System message',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: PART_TYPES.TEXT, text: 'System message' }],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.role).toBe('system');
    });

    it('should set correct id from DTO', () => {
      const dto: AIChatMessageDTO = {
        id: 'unique-message-id-123',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: PART_TYPES.TEXT, text: 'Test' }],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.id).toBe('unique-message-id-123');
    });

    it('should handle unknown part type with text field as text part', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-10',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: 'unknown-type', text: 'Some text content' } as AIChatMessagePartDTO],
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({ type: 'text', text: 'Some text content' });

      consoleSpy.mockRestore();
    });

    it('should filter out unknown part types without text and log warning', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-11',
        role: 'assistant',
        content: 'Fallback',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [{ type: 'unknown-type' } as AIChatMessagePartDTO],
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = mapper.toUIMessage(dto);

      expect(consoleSpy).toHaveBeenCalledWith('[MessageMapper] Unknown part type:', 'unknown-type');
      // Falls back to content since the unknown part was filtered
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({ type: 'text', text: 'Fallback' });

      consoleSpy.mockRestore();
    });

    it('should return empty array when no parts and no content', () => {
      const dto: AIChatMessageDTO = {
        id: 'msg-12',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T00:00:00Z',
        parts: [],
      };

      const result = mapper.toUIMessage(dto);

      expect(result.parts).toEqual([]);
    });
  });

  // ============================================================================
  // toUIMessages Tests - Array Mapping
  // ============================================================================

  describe('toUIMessages', () => {
    it('should map array of DTOs to UIMessages', () => {
      const dtos: AIChatMessageDTO[] = [
        {
          id: '1',
          role: 'user',
          content: '',
          timestamp: '2024-01-01T00:00:00Z',
          parts: [{ type: PART_TYPES.TEXT, text: 'Hi' }],
        },
        {
          id: '2',
          role: 'assistant',
          content: '',
          timestamp: '2024-01-01T00:00:01Z',
          parts: [{ type: PART_TYPES.TEXT, text: 'Hello!' }],
        },
      ];

      const result = mapper.toUIMessages(dtos);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].role).toBe('user');
      expect(result[1].id).toBe('2');
      expect(result[1].role).toBe('assistant');
    });

    it('should handle empty array', () => {
      const result = mapper.toUIMessages([]);

      expect(result).toEqual([]);
    });

    it('should maintain message order', () => {
      const dtos: AIChatMessageDTO[] = [
        {
          id: 'first',
          role: 'user',
          content: 'First',
          timestamp: '2024-01-01T00:00:00Z',
          parts: [{ type: PART_TYPES.TEXT, text: 'First' }],
        },
        {
          id: 'second',
          role: 'assistant',
          content: 'Second',
          timestamp: '2024-01-01T00:00:01Z',
          parts: [{ type: PART_TYPES.TEXT, text: 'Second' }],
        },
        {
          id: 'third',
          role: 'user',
          content: 'Third',
          timestamp: '2024-01-01T00:00:02Z',
          parts: [{ type: PART_TYPES.TEXT, text: 'Third' }],
        },
      ];

      const result = mapper.toUIMessages(dtos);

      expect(result[0].id).toBe('first');
      expect(result[1].id).toBe('second');
      expect(result[2].id).toBe('third');
    });
  });
});
