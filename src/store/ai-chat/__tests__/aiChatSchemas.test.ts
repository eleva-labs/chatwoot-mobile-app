import {
  AIChatBotApiSchema,
  AIChatBotsResponseSchema,
  AIChatSessionApiSchema,
  AIChatSessionsResponseSchema,
  AIChatMessagePartApiSchema,
  AIChatMessageApiSchema,
  AIChatMessagesResponseSchema,
  parseBotsResponse,
  parseSessionsResponse,
  parseMessagesResponse,
} from '../aiChatSchemas';

// ============================================================================
// Bot Schemas
// ============================================================================

describe('AIChatBotApiSchema', () => {
  it('parses valid bot data', () => {
    const data = { id: 1, name: 'Test Bot' };
    expect(AIChatBotApiSchema.parse(data)).toEqual(data);
  });

  it('parses bot with optional fields', () => {
    const data = {
      id: 1,
      name: 'Test Bot',
      avatar_url: 'https://example.com/avatar.png',
      description: 'A test bot',
    };
    const result = AIChatBotApiSchema.parse(data);
    expect(result.avatar_url).toBe('https://example.com/avatar.png');
    expect(result.description).toBe('A test bot');
  });

  it('rejects missing required fields', () => {
    expect(() => AIChatBotApiSchema.parse({ name: 'Bot' })).toThrow();
    expect(() => AIChatBotApiSchema.parse({ id: 1 })).toThrow();
  });

  it('rejects invalid types', () => {
    expect(() => AIChatBotApiSchema.parse({ id: 'not-a-number', name: 'Bot' })).toThrow();
  });
});

describe('AIChatBotsResponseSchema', () => {
  it('parses valid response', () => {
    const data = { bots: [{ id: 1, name: 'Bot' }] };
    const result = AIChatBotsResponseSchema.parse(data);
    expect(result.bots).toHaveLength(1);
  });

  it('parses empty bots array', () => {
    const result = AIChatBotsResponseSchema.parse({ bots: [] });
    expect(result.bots).toEqual([]);
  });
});

// ============================================================================
// Session Schemas
// ============================================================================

describe('AIChatSessionApiSchema', () => {
  it('parses valid session', () => {
    const data = {
      chat_session_id: 'session-123',
      updated_at: '2026-02-28T10:00:00Z',
    };
    expect(AIChatSessionApiSchema.parse(data)).toEqual(data);
  });

  it('parses session with optional fields', () => {
    const data = {
      chat_session_id: 'session-123',
      updated_at: '2026-02-28T10:00:00Z',
      created_at: '2026-02-27T10:00:00Z',
      agent_bot_id: 42,
      account_id: 1,
    };
    const result = AIChatSessionApiSchema.parse(data);
    expect(result.agent_bot_id).toBe(42);
  });

  it('rejects missing chat_session_id', () => {
    expect(() => AIChatSessionApiSchema.parse({ updated_at: '2026-02-28T10:00:00Z' })).toThrow();
  });
});

describe('AIChatSessionsResponseSchema', () => {
  it('parses valid sessions response', () => {
    const data = {
      sessions: [{ chat_session_id: 's1', updated_at: '2026-02-28T10:00:00Z' }],
    };
    const result = AIChatSessionsResponseSchema.parse(data);
    expect(result.sessions).toHaveLength(1);
  });
});

// ============================================================================
// Message Schemas
// ============================================================================

describe('AIChatMessagePartApiSchema', () => {
  it('parses minimal part', () => {
    const data = { type: 'text' };
    expect(AIChatMessagePartApiSchema.parse(data)).toEqual(data);
  });

  it('parses part with all optional fields', () => {
    const data = {
      type: 'tool-call',
      text: undefined,
      toolName: 'search',
      toolCallId: 'tc-1',
      args: { query: 'test' },
      result: { data: 'result' },
      state: 'input-available',
    };
    const result = AIChatMessagePartApiSchema.parse(data);
    expect(result.toolName).toBe('search');
    expect(result.args).toEqual({ query: 'test' });
  });

  it('rejects missing type', () => {
    expect(() => AIChatMessagePartApiSchema.parse({ text: 'hello' })).toThrow();
  });
});

describe('AIChatMessageApiSchema', () => {
  it('parses valid message', () => {
    const data = {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: '2026-02-28T10:00:00Z',
    };
    const result = AIChatMessageApiSchema.parse(data);
    expect(result.id).toBe('msg-1');
  });

  it('parses message with parts', () => {
    const data = {
      id: 'msg-2',
      role: 'assistant',
      content: '',
      timestamp: '2026-02-28T10:00:00Z',
      parts: [{ type: 'text', text: 'Hello' }],
    };
    const result = AIChatMessageApiSchema.parse(data);
    expect(result.parts).toHaveLength(1);
  });

  it('rejects invalid role', () => {
    expect(() =>
      AIChatMessageApiSchema.parse({
        id: 'msg-1',
        role: 'invalid',
        content: 'Hello',
        timestamp: '2026-02-28T10:00:00Z',
      }),
    ).toThrow();
  });

  it('allows valid roles: user, assistant, system', () => {
    const base = { id: 'msg-1', content: 'Hello', timestamp: '2026-02-28T10:00:00Z' };
    expect(AIChatMessageApiSchema.parse({ ...base, role: 'user' }).role).toBe('user');
    expect(AIChatMessageApiSchema.parse({ ...base, role: 'assistant' }).role).toBe('assistant');
    expect(AIChatMessageApiSchema.parse({ ...base, role: 'system' }).role).toBe('system');
  });
});

describe('AIChatMessagesResponseSchema', () => {
  it('parses valid messages response', () => {
    const data = {
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: '2026-02-28T10:00:00Z' },
      ],
    };
    const result = AIChatMessagesResponseSchema.parse(data);
    expect(result.messages).toHaveLength(1);
  });
});

// ============================================================================
// Parse Functions
// ============================================================================

describe('parseBotsResponse', () => {
  it('parses valid data', () => {
    const result = parseBotsResponse({ bots: [{ id: 1, name: 'Bot' }] });
    expect(result.bots).toHaveLength(1);
  });

  it('throws on invalid data', () => {
    expect(() => parseBotsResponse({ invalid: true })).toThrow();
  });
});

describe('parseSessionsResponse', () => {
  it('parses valid data', () => {
    const result = parseSessionsResponse({
      sessions: [{ chat_session_id: 's1', updated_at: '2026-02-28T10:00:00Z' }],
    });
    expect(result.sessions).toHaveLength(1);
  });
});

describe('parseMessagesResponse', () => {
  it('parses valid data', () => {
    const result = parseMessagesResponse({
      messages: [{ id: 'msg-1', role: 'user', content: 'Hi', timestamp: '2026-02-28T10:00:00Z' }],
    });
    expect(result.messages).toHaveLength(1);
  });
});
