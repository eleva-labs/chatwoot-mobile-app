/**
 * AIPartRenderer Component
 *
 * Dynamic router component that renders the appropriate part component based on part type.
 * Follows Vue's AiPartRenderer patterns:
 * - Routes to AITextPart for text parts
 * - Routes to AIReasoningPart for reasoning parts
 * - Routes to AIToolPart for tool-call and tool-result parts (and all tool-* variants)
 * - Handles unknown part types gracefully
 *
 * IMPORTANT: Uses domain type guards which correctly handle all tool-* part types
 * via startsWith('tool-') pattern, supporting both SDK and backend formats.
 */

import React from 'react';
import { View, Text } from 'react-native';

import { useThemedStyles } from '@/hooks';
import { AITextPart } from './AITextPart';
import { AIReasoningPart } from './AIReasoningPart';
import { AIToolPart } from './AIToolPart';

// Import domain types and type guards (P0 fix: use startsWith pattern)
import {
  isTextPart,
  isReasoningPart,
  isToolPart,
  type MessagePart,
  type TextPart,
  type ReasoningPart,
  type ToolPart,
} from '@/types/ai-chat/parts';

// ============================================================================
// Types
// ============================================================================

export interface UnknownPart {
  type: string;
  [key: string]: unknown;
}

export interface AIPartRendererProps {
  /** The message part to render */
  part: MessagePart | UnknownPart;
  /** Role of the message (affects text styling) */
  role?: 'user' | 'assistant';
  /** Whether this part is currently streaming */
  isStreaming?: boolean;
  /** Whether this is the last part in the message */
  isLastPart?: boolean;
}

// Re-export MessagePart type for convenience (includes UnknownPart)
export type { MessagePart, TextPart, ReasoningPart, ToolPart };

// ============================================================================
// Component
// ============================================================================

export const AIPartRenderer: React.FC<AIPartRendererProps> = ({
  part,
  role = 'assistant',
  isStreaming = false,
  isLastPart = false,
}) => {
  const themedTailwind = useThemedStyles();

  // Route to appropriate component based on part type
  if (isTextPart(part)) {
    return <AITextPart part={part} role={role} isStreaming={isStreaming && isLastPart} />;
  }

  if (isReasoningPart(part)) {
    return <AIReasoningPart part={part} isStreaming={isStreaming} />;
  }

  if (isToolPart(part)) {
    return <AIToolPart part={part} isStreaming={isStreaming} />;
  }

  // Handle unknown part types in development
  if (__DEV__) {
    return (
      <View style={themedTailwind.style('p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 my-1')}>
        <Text
          style={themedTailwind.style('text-xs font-mono text-yellow-700 dark:text-yellow-300')}>
          Unknown part type: {part.type}
        </Text>
      </View>
    );
  }

  // In production, silently ignore unknown parts
  return null;
};

// ============================================================================
// Re-export Helper Functions from Domain
// ============================================================================

// Re-export all part helpers from domain layer for convenience
// This provides a single import point for components that need part utilities
export {
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
} from '@/types/ai-chat/parts';

export default AIPartRenderer;
