import { mapMessageToUIMessage, mapMessagesToUIMessages } from '../aiChatMapper';
import type { AIChatMessage } from '../aiChatSchemas';

describe('mapMessageToUIMessage', () => {
  it('maps a simple text message', () => {
    const msg: AIChatMessage = {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello world',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [{ type: 'text', text: 'Hello world' }],
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.id).toBe('msg-1');
    expect(result.role).toBe('assistant');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toEqual({ type: 'text', text: 'Hello world' });
  });

  it('maps a reasoning part with state: done', () => {
    const msg: AIChatMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [{ type: 'reasoning', text: 'Thinking about this...' }],
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toEqual({
      type: 'reasoning',
      text: 'Thinking about this...',
      state: 'done',
    });
  });

  it('maps tool-call to dynamic-tool with input-available state', () => {
    const msg: AIChatMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'search',
          args: { query: 'test' },
        },
      ],
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toHaveLength(1);
    const part = result.parts[0] as Record<string, unknown>;
    expect(part.type).toBe('dynamic-tool');
    expect(part.toolCallId).toBe('tc-1');
    expect(part.toolName).toBe('search');
    expect(part.state).toBe('input-available');
    expect(part.input).toEqual({ query: 'test' });
  });

  it('maps tool-input-available to dynamic-tool with input-available state', () => {
    const msg: AIChatMessage = {
      id: 'msg-3b',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [
        {
          type: 'tool-input-available',
          toolCallId: 'tc-1b',
          toolName: 'lookup',
          args: { id: '42' },
        },
      ],
    };
    const result = mapMessageToUIMessage(msg);
    const part = result.parts[0] as Record<string, unknown>;
    expect(part.type).toBe('dynamic-tool');
    expect(part.state).toBe('input-available');
  });

  it('maps tool-result to dynamic-tool with output-available state', () => {
    const msg: AIChatMessage = {
      id: 'msg-4',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [
        {
          type: 'tool-result',
          toolCallId: 'tc-1',
          toolName: 'search',
          args: { query: 'test' },
          result: { results: ['result1', 'result2'] },
        },
      ],
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toHaveLength(1);
    const part = result.parts[0] as Record<string, unknown>;
    expect(part.type).toBe('dynamic-tool');
    expect(part.state).toBe('output-available');
    expect(part.output).toEqual({ results: ['result1', 'result2'] });
  });

  it('maps tool-output-available to dynamic-tool with output-available state', () => {
    const msg: AIChatMessage = {
      id: 'msg-4b',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [
        {
          type: 'tool-output-available',
          toolCallId: 'tc-2',
          toolName: 'fetch',
          result: 'data',
        },
      ],
    };
    const result = mapMessageToUIMessage(msg);
    const part = result.parts[0] as Record<string, unknown>;
    expect(part.type).toBe('dynamic-tool');
    expect(part.state).toBe('output-available');
  });

  it('falls back to text for unknown part with text content', () => {
    const msg: AIChatMessage = {
      id: 'msg-5',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [{ type: 'custom-widget', text: 'custom content' }],
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toEqual({ type: 'text', text: 'custom content' });
  });

  it('filters out unknown parts without text', () => {
    const msg: AIChatMessage = {
      id: 'msg-6',
      role: 'assistant',
      content: 'fallback',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [{ type: 'unknown-type' }],
    };
    const result = mapMessageToUIMessage(msg);
    // Falls back to content as text since all parts were filtered
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toEqual({ type: 'text', text: 'fallback' });
  });

  it('creates text part from content when no parts exist', () => {
    const msg: AIChatMessage = {
      id: 'msg-7',
      role: 'user',
      content: 'Hello',
      timestamp: '2026-02-28T10:00:00Z',
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toEqual({ type: 'text', text: 'Hello' });
  });

  it('returns empty parts when no content and no parts', () => {
    const msg: AIChatMessage = {
      id: 'msg-8',
      role: 'user',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
    };
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toEqual([]);
  });

  it('handles backwards-compatible reasoning field', () => {
    const msg: AIChatMessage = {
      id: 'msg-9',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [{ type: 'reasoning' }],
    };
    // The part has no text, but may have reasoning field via cast
    const result = mapMessageToUIMessage(msg);
    expect(result.parts).toHaveLength(1);
    expect((result.parts[0] as { text: string }).text).toBe('');
  });
});

describe('mapMessagesToUIMessages', () => {
  it('maps multiple messages', () => {
    const msgs: AIChatMessage[] = [
      { id: '1', role: 'user', content: 'Hi', timestamp: '2026-02-28T10:00:00Z' },
      { id: '2', role: 'assistant', content: 'Hello!', timestamp: '2026-02-28T10:01:00Z' },
    ];
    const result = mapMessagesToUIMessages(msgs);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
  });

  it('handles empty array', () => {
    expect(mapMessagesToUIMessages([])).toEqual([]);
  });
});
