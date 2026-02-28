import type { UIMessage } from 'ai';
import {
  validateMessage,
  validateAndNormalizeParts,
  validateAndNormalizeMessages,
} from '../aiChatMessageUtils';

describe('validateMessage', () => {
  it('returns null for null input', () => {
    expect(validateMessage(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(validateMessage(undefined)).toBeNull();
  });

  it('returns null for message without id', () => {
    expect(validateMessage({ role: 'user', parts: [] } as unknown as UIMessage)).toBeNull();
  });

  it('returns null for message without role', () => {
    expect(validateMessage({ id: '1', parts: [] } as unknown as UIMessage)).toBeNull();
  });

  it('returns valid message unchanged', () => {
    const msg: UIMessage = { id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] };
    expect(validateMessage(msg)).toBe(msg);
  });

  it('returns message with empty parts if parts is non-array truthy value', () => {
    const msg = { id: '1', role: 'user', parts: 'invalid' } as unknown as UIMessage;
    const result = validateMessage(msg);
    expect(result).not.toBeNull();
    expect(result!.parts).toEqual([]);
  });

  it('passes through message with undefined parts', () => {
    const msg = { id: '1', role: 'user' } as unknown as UIMessage;
    const result = validateMessage(msg);
    expect(result).toBe(msg);
  });
});

describe('validateAndNormalizeParts', () => {
  it('returns message unchanged if parts is empty', () => {
    const msg: UIMessage = { id: '1', role: 'user', parts: [] };
    expect(validateAndNormalizeParts(msg)).toBe(msg);
  });

  it('filters out parts without type', () => {
    const msg = {
      id: '1',
      role: 'user' as const,
      parts: [
        { type: 'text', text: 'hello' },
        { noType: true },
        { type: 'text', text: 'world' },
      ],
    } as unknown as UIMessage;
    const result = validateAndNormalizeParts(msg);
    expect(result.parts).toHaveLength(2);
  });

  it('filters out text parts without text or content', () => {
    const msg = {
      id: '1',
      role: 'user' as const,
      parts: [
        { type: 'text' }, // No text or content
        { type: 'text', text: 'valid' },
      ],
    } as unknown as UIMessage;
    const result = validateAndNormalizeParts(msg);
    expect(result.parts).toHaveLength(1);
  });

  it('normalizes text part with content to use text property', () => {
    const msg = {
      id: '1',
      role: 'user' as const,
      parts: [{ type: 'text', content: 'from content' }],
    } as unknown as UIMessage;
    const result = validateAndNormalizeParts(msg);
    expect(result.parts).toHaveLength(1);
    expect((result.parts[0] as { text: unknown }).text).toBe('from content');
  });

  it('keeps non-text parts even without text field', () => {
    const msg: UIMessage = {
      id: '1',
      role: 'assistant',
      parts: [{ type: 'reasoning' as 'text', text: '' }],
    };
    // reasoning type is a valid object with a type, it passes through
    const result = validateAndNormalizeParts(msg);
    expect(result.parts).toHaveLength(1);
  });
});

describe('validateAndNormalizeMessages', () => {
  it('filters and normalizes messages', () => {
    const messages = [
      { id: '1', role: 'user' as const, parts: [{ type: 'text' as const, text: 'hello' }] },
      null as unknown as UIMessage,
      { role: 'user' } as unknown as UIMessage, // Missing id
      { id: '2', role: 'assistant' as const, parts: [{ type: 'text' as const, text: 'hi' }] },
    ];
    const result = validateAndNormalizeMessages(messages);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('returns empty array for empty input', () => {
    expect(validateAndNormalizeMessages([])).toEqual([]);
  });
});
