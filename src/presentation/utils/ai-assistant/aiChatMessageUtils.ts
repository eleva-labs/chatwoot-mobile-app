import type { UIMessage } from 'ai';
// Use domain constants and type guards instead of hardcoded strings
import { PART_TYPES } from '@/types/ai-chat/constants';
import { isTextPart, type MessagePart } from '@/types/ai-chat/parts';

/**
 * Validates and normalizes a message to ensure it has the correct structure
 */
export function validateMessage(msg: UIMessage | null | undefined): UIMessage | null {
  // Ensure message has required properties
  if (!msg || !msg.id || !msg.role) {
    return null;
  }

  // Ensure parts is either undefined, null, or a valid array
  if (msg.parts !== undefined && msg.parts !== null && !Array.isArray(msg.parts)) {
    // Fix it by returning a new message with empty parts
    return { ...msg, parts: [] };
  }

  return msg;
}

/**
 * Validates and normalizes message parts
 */
export function validateAndNormalizeParts(msg: UIMessage): UIMessage {
  if (!Array.isArray(msg.parts) || msg.parts.length === 0) {
    return msg;
  }

  const validParts = msg.parts
    .filter(part => {
      // Part must exist, be an object, and have a type
      if (!part || typeof part !== 'object' || !('type' in part)) {
        return false;
      }
      // For text parts, ensure they have either 'text' or 'content' property
      // Use domain type guard instead of hardcoded string
      if (isTextPart(part as MessagePart)) {
        const hasText = 'text' in part && part.text != null;
        const hasContent = 'content' in part && part.content != null;
        return hasText || hasContent;
      }
      // For other part types, just ensure they're valid objects
      return true;
    })
    .map(part => {
      // Normalize text parts to ensure they have 'text' property
      // Use domain type guard and constant instead of hardcoded string
      if (isTextPart(part as MessagePart) && !('text' in part) && 'content' in part) {
        const partObj = part as Record<string, unknown>;
        return { ...partObj, type: PART_TYPES.TEXT, text: partObj.content };
      }
      return part;
    });

  if (validParts.length !== msg.parts.length) {
    return { ...msg, parts: validParts as UIMessage['parts'] };
  }

  return msg;
}

/**
 * Validates and normalizes an array of messages
 */
export function validateAndNormalizeMessages(messages: UIMessage[]): UIMessage[] {
  return messages
    .map(msg => {
      const validated = validateMessage(msg);
      if (!validated) {
        return null;
      }
      return validateAndNormalizeParts(validated);
    })
    .filter((msg): msg is UIMessage => msg !== null);
}
