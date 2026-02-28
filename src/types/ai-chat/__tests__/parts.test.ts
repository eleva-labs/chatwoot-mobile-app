import {
  isTextPart,
  isReasoningPart,
  isToolPart,
  isToolCallPart,
  isToolResultPart,
  filterPartsByType,
  getTextParts,
  getReasoningParts,
  getToolParts,
  hasReasoningParts,
  hasToolParts,
  getDeduplicatedToolParts,
  deriveToolDisplayState,
  isToolExecuting,
  isToolComplete,
  isToolFailed,
  getMessageTextContent,
  getLastAssistantMessage,
  getActiveReasoning,
  type MessagePart,
  type TextPart,
  type ReasoningPart,
  type ToolCallPart,
  type ToolResultPart,
  type ToolPart,
} from '../parts';
import { TOOL_STATES } from '../constants';

// ============================================================================
// Type Guards
// ============================================================================

describe('isTextPart', () => {
  it('matches text type', () => {
    expect(isTextPart({ type: 'text', text: 'hello' })).toBe(true);
  });

  it('does not match reasoning type', () => {
    expect(isTextPart({ type: 'reasoning', text: 'thinking' })).toBe(false);
  });

  it('does not match tool type', () => {
    expect(isTextPart({ type: 'tool-call' })).toBe(false);
  });
});

describe('isReasoningPart', () => {
  it('matches reasoning type', () => {
    expect(isReasoningPart({ type: 'reasoning', text: 'thinking' })).toBe(true);
  });

  it('does not match text type', () => {
    expect(isReasoningPart({ type: 'text', text: 'hello' })).toBe(false);
  });
});

describe('isToolPart', () => {
  it('matches tool-call type', () => {
    expect(isToolPart({ type: 'tool-call' })).toBe(true);
  });

  it('matches tool-result type', () => {
    expect(isToolPart({ type: 'tool-result' })).toBe(true);
  });

  it('matches tool-invocation type', () => {
    expect(isToolPart({ type: 'tool-invocation' })).toBe(true);
  });

  it('matches dynamic tool-{name} types', () => {
    expect(isToolPart({ type: 'tool-search' })).toBe(true);
  });

  it('matches backend tool types', () => {
    expect(isToolPart({ type: 'tool-input-streaming' })).toBe(true);
    expect(isToolPart({ type: 'tool-input-available' })).toBe(true);
    expect(isToolPart({ type: 'tool-output-available' })).toBe(true);
    expect(isToolPart({ type: 'tool-output-error' })).toBe(true);
  });

  it('does not match text type', () => {
    expect(isToolPart({ type: 'text' })).toBe(false);
  });

  it('does not match reasoning type', () => {
    expect(isToolPart({ type: 'reasoning' })).toBe(false);
  });

  it('handles undefined type gracefully', () => {
    expect(isToolPart({ type: undefined } as unknown as MessagePart)).toBe(false);
  });
});

describe('isToolCallPart', () => {
  it('matches tool-call', () => {
    expect(isToolCallPart({ type: 'tool-call' })).toBe(true);
  });

  it('matches tool-invocation', () => {
    expect(isToolCallPart({ type: 'tool-invocation' })).toBe(true);
  });

  it('matches tool-input-streaming', () => {
    expect(isToolCallPart({ type: 'tool-input-streaming' })).toBe(true);
  });

  it('matches tool-input-available', () => {
    expect(isToolCallPart({ type: 'tool-input-available' })).toBe(true);
  });

  it('does not match tool-result', () => {
    expect(isToolCallPart({ type: 'tool-result' })).toBe(false);
  });
});

describe('isToolResultPart', () => {
  it('matches tool-result', () => {
    expect(isToolResultPart({ type: 'tool-result' })).toBe(true);
  });

  it('matches tool-output-available', () => {
    expect(isToolResultPart({ type: 'tool-output-available' })).toBe(true);
  });

  it('matches tool-output-error', () => {
    expect(isToolResultPart({ type: 'tool-output-error' })).toBe(true);
  });

  it('does not match tool-call', () => {
    expect(isToolResultPart({ type: 'tool-call' })).toBe(false);
  });
});

// ============================================================================
// Extraction Helpers
// ============================================================================

describe('filterPartsByType', () => {
  it('returns empty array for undefined input', () => {
    expect(filterPartsByType(undefined, isTextPart)).toEqual([]);
  });

  it('filters correctly', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'hello' },
      { type: 'reasoning', text: 'thinking' },
      { type: 'text', text: 'world' },
    ];
    const result = filterPartsByType(parts, isTextPart);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('hello');
    expect(result[1].text).toBe('world');
  });
});

describe('getTextParts', () => {
  it('returns text parts only', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'hello' },
      { type: 'reasoning', text: 'thinking' },
    ];
    const result = getTextParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('hello');
  });

  it('returns empty array for undefined', () => {
    expect(getTextParts(undefined)).toEqual([]);
  });
});

describe('getReasoningParts', () => {
  it('returns reasoning parts only', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'hello' },
      { type: 'reasoning', text: 'thinking' },
    ];
    const result = getReasoningParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('thinking');
  });
});

describe('getToolParts', () => {
  it('returns tool parts only', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'hello' },
      { type: 'tool-call', toolCallId: 'tc1', toolName: 'search' } as ToolCallPart,
      { type: 'tool-result', toolCallId: 'tc1' } as ToolResultPart,
    ];
    const result = getToolParts(parts);
    expect(result).toHaveLength(2);
  });
});

describe('hasReasoningParts', () => {
  it('returns true when reasoning parts exist', () => {
    expect(hasReasoningParts([{ type: 'reasoning', text: 'thinking' }])).toBe(true);
  });

  it('returns false when no reasoning parts', () => {
    expect(hasReasoningParts([{ type: 'text', text: 'hello' }])).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(hasReasoningParts(undefined)).toBe(false);
  });
});

describe('hasToolParts', () => {
  it('returns true when tool parts exist', () => {
    expect(hasToolParts([{ type: 'tool-call', toolCallId: 'tc1', toolName: 'search' } as ToolCallPart])).toBe(true);
  });

  it('returns false when no tool parts', () => {
    expect(hasToolParts([{ type: 'text', text: 'hello' }])).toBe(false);
  });
});

describe('getDeduplicatedToolParts', () => {
  it('deduplicates by toolCallId, keeping latest', () => {
    const parts: MessagePart[] = [
      { type: 'tool-input-streaming', toolCallId: 'tc1', toolName: 'search', state: 'input-streaming' } as ToolCallPart,
      { type: 'tool-input-available', toolCallId: 'tc1', toolName: 'search', state: 'input-available' } as ToolCallPart,
      { type: 'tool-output-available', toolCallId: 'tc1', toolName: 'search', state: 'output-available' } as unknown as ToolPart,
    ];
    const result = getDeduplicatedToolParts(parts);
    expect(result).toHaveLength(1);
    expect((result[0] as ToolResultPart).state).toBe('output-available');
  });

  it('handles parts with different toolCallIds', () => {
    const parts: MessagePart[] = [
      { type: 'tool-call', toolCallId: 'tc1', toolName: 'search' } as ToolCallPart,
      { type: 'tool-call', toolCallId: 'tc2', toolName: 'lookup' } as ToolCallPart,
    ];
    const result = getDeduplicatedToolParts(parts);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for undefined input', () => {
    expect(getDeduplicatedToolParts(undefined)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(getDeduplicatedToolParts([])).toEqual([]);
  });
});

// ============================================================================
// Tool State Helpers
// ============================================================================

describe('deriveToolDisplayState', () => {
  it('returns explicit state when present', () => {
    const part: ToolCallPart = { type: 'tool-call', toolCallId: 'tc1', toolName: 'search', state: 'input-streaming' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.INPUT_STREAMING);
  });

  it('prefers explicit state over type-derived state', () => {
    const part: ToolCallPart = { type: 'tool-call', toolCallId: 'tc1', toolName: 'search', state: 'output-available' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.OUTPUT_AVAILABLE);
  });

  it('derives INPUT_STREAMING from type', () => {
    const part: ToolCallPart = { type: 'tool-input-streaming', toolCallId: 'tc1', toolName: 'search' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.INPUT_STREAMING);
  });

  it('derives INPUT_AVAILABLE from tool-call type', () => {
    const part: ToolCallPart = { type: 'tool-call', toolCallId: 'tc1', toolName: 'search' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.INPUT_AVAILABLE);
  });

  it('derives OUTPUT_AVAILABLE from tool-result type', () => {
    const part: ToolResultPart = { type: 'tool-result', toolCallId: 'tc1' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.OUTPUT_AVAILABLE);
  });

  it('derives OUTPUT_ERROR from tool-output-error type', () => {
    const part: ToolResultPart = { type: 'tool-output-error', toolCallId: 'tc1' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.OUTPUT_ERROR);
  });

  it('returns PENDING as fallback for unknown types', () => {
    const part: ToolCallPart = { type: 'tool-unknown', toolCallId: 'tc1', toolName: 'x' };
    expect(deriveToolDisplayState(part)).toBe(TOOL_STATES.PENDING);
  });
});

describe('isToolExecuting', () => {
  it('returns true for INPUT_STREAMING', () => {
    expect(isToolExecuting(TOOL_STATES.INPUT_STREAMING)).toBe(true);
  });

  it('returns true for INPUT_AVAILABLE', () => {
    expect(isToolExecuting(TOOL_STATES.INPUT_AVAILABLE)).toBe(true);
  });

  it('returns false for OUTPUT_AVAILABLE', () => {
    expect(isToolExecuting(TOOL_STATES.OUTPUT_AVAILABLE)).toBe(false);
  });

  it('returns false for OUTPUT_ERROR', () => {
    expect(isToolExecuting(TOOL_STATES.OUTPUT_ERROR)).toBe(false);
  });
});

describe('isToolComplete', () => {
  it('returns true for OUTPUT_AVAILABLE', () => {
    expect(isToolComplete(TOOL_STATES.OUTPUT_AVAILABLE)).toBe(true);
  });

  it('returns true for OUTPUT_ERROR', () => {
    expect(isToolComplete(TOOL_STATES.OUTPUT_ERROR)).toBe(true);
  });

  it('returns false for INPUT_STREAMING', () => {
    expect(isToolComplete(TOOL_STATES.INPUT_STREAMING)).toBe(false);
  });
});

describe('isToolFailed', () => {
  it('returns true for OUTPUT_ERROR', () => {
    expect(isToolFailed(TOOL_STATES.OUTPUT_ERROR)).toBe(true);
  });

  it('returns false for OUTPUT_AVAILABLE', () => {
    expect(isToolFailed(TOOL_STATES.OUTPUT_AVAILABLE)).toBe(false);
  });
});

// ============================================================================
// Message Helpers
// ============================================================================

describe('getMessageTextContent', () => {
  it('joins text from all text parts', () => {
    const message = {
      id: '1',
      role: 'assistant' as const,
      parts: [
        { type: 'text' as const, text: 'Hello ' },
        { type: 'text' as const, text: 'world' },
      ],
    };
    expect(getMessageTextContent(message)).toBe('Hello world');
  });

  it('returns empty string for no text parts', () => {
    const message = {
      id: '1',
      role: 'assistant' as const,
      parts: [{ type: 'reasoning' as const, text: 'thinking' }],
    };
    expect(getMessageTextContent(message)).toBe('');
  });

  it('returns empty string for undefined parts', () => {
    const message = {
      id: '1',
      role: 'assistant' as const,
      parts: [],
    };
    expect(getMessageTextContent(message)).toBe('');
  });
});

describe('getLastAssistantMessage', () => {
  it('returns the last assistant message', () => {
    const messages = [
      { id: '1', role: 'user' as const, parts: [] },
      { id: '2', role: 'assistant' as const, parts: [] },
      { id: '3', role: 'user' as const, parts: [] },
      { id: '4', role: 'assistant' as const, parts: [] },
    ];
    const result = getLastAssistantMessage(messages);
    expect(result?.id).toBe('4');
  });

  it('returns undefined for empty array', () => {
    expect(getLastAssistantMessage([])).toBeUndefined();
  });

  it('returns undefined when no assistant messages', () => {
    const messages = [
      { id: '1', role: 'user' as const, parts: [] },
    ];
    expect(getLastAssistantMessage(messages)).toBeUndefined();
  });
});

describe('getActiveReasoning', () => {
  it('returns reasoning parts from last assistant message', () => {
    const messages = [
      { id: '1', role: 'user' as const, parts: [] },
      {
        id: '2',
        role: 'assistant' as const,
        parts: [
          { type: 'reasoning' as const, text: 'thinking...' },
          { type: 'text' as const, text: 'answer' },
        ],
      },
    ];
    const result = getActiveReasoning(messages);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('thinking...');
  });

  it('returns empty array when no assistant messages', () => {
    expect(getActiveReasoning([])).toEqual([]);
  });
});
