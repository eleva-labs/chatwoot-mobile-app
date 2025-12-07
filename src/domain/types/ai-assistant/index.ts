/**
 * AI Assistant Domain Types
 *
 * Central export point for all AI Assistant type definitions.
 * Re-exports Vercel SDK types as domain types for consistency.
 */

// ============================================================================
// Re-export Vercel SDK Types
// ============================================================================

// ============================================================================
// Domain Type Aliases
// ============================================================================

import type { UIMessage } from 'ai';

export type { UIMessage, CreateMessage, Message } from 'ai';

/**
 * Domain alias for UIMessage
 * Use this in domain/application layers for clarity
 */
export type AIMessage = UIMessage;

// ============================================================================
// Re-export Domain Types
// ============================================================================

// Constants
export {
  PART_TYPES,
  TOOL_STATES,
  CHAT_STATUS,
  MESSAGE_ROLES,
  type PartType,
  type ToolState,
  type ChatStatus,
  type MessageRole,
} from './constants';

// Part types and helpers
export {
  // Types
  type BasePart,
  type TextPart,
  type ReasoningPart,
  type ToolCallPart,
  type ToolResultPart,
  type ToolPart,
  type MessagePart,

  // Type guards
  isTextPart,
  isReasoningPart,
  isToolPart,
  isToolCallPart,
  isToolResultPart,

  // Part extraction
  filterPartsByType,
  getTextParts,
  getReasoningParts,
  getToolParts,
  hasReasoningParts,
  hasToolParts,
  getDeduplicatedToolParts,

  // Tool state helpers
  deriveToolDisplayState,
  isToolExecuting,
  isToolComplete,
  isToolFailed,

  // Message helpers
  getMessageTextContent,
  getLastAssistantMessage,
  getActiveReasoning,
} from './parts';
