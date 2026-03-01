/**
 * AI Chat Mapper
 *
 * Pure functions to convert backend message DTOs to Vercel SDK UIMessage format.
 * Ported from MessageMapper.ts — preserves ALL part mapping logic including
 * tool calls (dynamic-tool with input-available), tool results (dynamic-tool
 * with output-available), and reasoning parts.
 *
 * CRITICAL: Losing this logic means historical messages display as plain text
 * instead of showing tool invocations and reasoning sections.
 */

import type { UIMessage } from 'ai';
import type { AIChatMessage, AIChatMessagePart } from './aiChatSchemas';
import { PART_TYPES } from '@/types/ai-chat/constants';

// === Message -> UIMessage mapping ===

/**
 * Map a single backend message DTO to UIMessage
 */
export function mapMessageToUIMessage(msg: AIChatMessage): UIMessage {
  const parts = mapParts(msg.parts, msg.content);
  return {
    id: msg.id,
    role: msg.role,
    parts,
  };
}

/**
 * Map multiple backend message DTOs to UIMessages
 */
export function mapMessagesToUIMessages(msgs: AIChatMessage[]): UIMessage[] {
  return msgs.map(mapMessageToUIMessage);
}

// === Part mapping (critical — preserves tool calls + reasoning) ===

/**
 * Map message parts from DTO format to SDK format.
 * Always returns an array (never undefined).
 *
 * If no parts exist but fallback content is available, creates a text part.
 * If all parts are unmappable, falls back to content as text.
 */
function mapParts(parts?: AIChatMessagePart[], fallbackContent?: string): UIMessage['parts'] {
  // If no parts but we have content, create a text part
  if (!parts || parts.length === 0) {
    if (fallbackContent) {
      return [{ type: 'text' as const, text: fallbackContent }];
    }
    return [];
  }

  const mapped = parts.map(mapPart).filter((p): p is NonNullable<typeof p> => p !== null);

  // If all parts were filtered out but we have content, use that
  if (mapped.length === 0 && fallbackContent) {
    return [{ type: 'text' as const, text: fallbackContent }];
  }
  return mapped;
}

/**
 * Map a single part from DTO to SDK format.
 *
 * Handles:
 * - text parts -> { type: 'text', text }
 * - reasoning parts -> { type: 'reasoning', text, state: 'done' }
 * - tool-call / tool-input-available -> { type: 'dynamic-tool', state: 'input-available' }
 * - tool-result / tool-output-available -> { type: 'dynamic-tool', state: 'output-available' }
 * - unknown parts with text -> text fallback
 * - unknown parts without text -> null (filtered out)
 */
function mapPart(part: AIChatMessagePart): UIMessage['parts'][number] | null {
  const type = part.type;

  // Text parts
  if (type === PART_TYPES.TEXT) {
    return {
      type: 'text' as const,
      text: part.text || '',
    };
  }

  // Reasoning parts - SDK v5 uses 'text' not 'reasoning'
  if (type === PART_TYPES.REASONING) {
    return {
      type: 'reasoning' as const,
      text: part.text || (part as { reasoning?: string }).reasoning || '',
      state: 'done' as const,
    };
  }

  // Tool call parts - SDK v5 uses 'dynamic-tool' type
  if (type === PART_TYPES.TOOL_CALL || type === PART_TYPES.TOOL_INPUT_AVAILABLE) {
    return {
      type: 'dynamic-tool' as const,
      toolCallId: part.toolCallId || '',
      toolName: part.toolName || '',
      state: 'input-available' as const,
      input: part.args || {},
    } as UIMessage['parts'][number];
  }

  // Tool result parts - SDK v5 uses 'dynamic-tool' with output
  if (type === PART_TYPES.TOOL_RESULT || type === PART_TYPES.TOOL_OUTPUT_AVAILABLE) {
    return {
      type: 'dynamic-tool' as const,
      toolCallId: part.toolCallId || '',
      toolName: part.toolName || '',
      state: 'output-available' as const,
      input: part.args || {},
      output: part.result,
    } as UIMessage['parts'][number];
  }

  // Unknown part type - return as text if has content
  if (part.text) {
    return {
      type: 'text' as const,
      text: part.text,
    };
  }

  console.warn('[aiChatMapper] Unknown part type:', type);
  return null;
}
