/**
 * AIPartRenderer Component
 *
 * Dynamic router component that renders the appropriate part component based on part type.
 * Uses a registry-based dispatch pattern:
 * 1. Check parts registry for the part type
 * 2. For tool parts, check tools registry by toolName
 * 3. Fall back to built-in renderers (AITextPart, AIReasoningPart, AIToolPart)
 * 4. Wrap custom registry components in error boundaries
 *
 * IMPORTANT: Uses domain type guards which correctly handle all tool-* part types
 * via startsWith('tool-') pattern, supporting both SDK and backend formats.
 */

import React from 'react';
import { View, Text } from 'react-native';

import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useAIChatRegistries } from '@presentation/ai-chat/hooks/ai-assistant/useAIChatProvider';
import { AITextPart } from './AITextPart';
import { AIReasoningPart } from './AIReasoningPart';
import { AIToolPart } from './AIToolPart';

// Import domain types and type guards
import {
  isTextPart,
  isReasoningPart,
  isToolPart,
  type MessagePart,
  type TextPart,
  type ReasoningPart,
  type ToolPart,
} from '@domain/types/ai-chat/parts';

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

export type { MessagePart, TextPart, ReasoningPart, ToolPart };

// ============================================================================
// Error Boundary for Custom Registry Components
// ============================================================================

interface PartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PartErrorBoundary extends React.Component<
  { children: React.ReactNode; partType: string },
  PartErrorBoundaryState
> {
  state: PartErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): PartErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (__DEV__) {
        return (
          <View
            style={{ padding: 8, backgroundColor: '#FFF3CD', borderRadius: 4, marginVertical: 2 }}>
            <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#856404' }}>
              Error in custom part renderer ({this.props.partType}): {this.state.error?.message}
            </Text>
          </View>
        );
      }
      return null;
    }
    return this.props.children;
  }
}

// ============================================================================
// Component
// ============================================================================

export const AIPartRenderer: React.FC<AIPartRendererProps> = ({
  part,
  role = 'assistant',
  isStreaming = false,
  isLastPart = false,
}) => {
  const { style } = useAIStyles();
  const { parts: partsRegistry, tools: toolsRegistry } = useAIChatRegistries();

  // 1. Check parts registry for a custom renderer for this part type
  const CustomPartComponent = partsRegistry.get(part.type);
  if (CustomPartComponent) {
    const partProps = part as { type: string; [key: string]: unknown };
    return (
      <PartErrorBoundary partType={part.type}>
        <CustomPartComponent
          part={partProps}
          role={role}
          isStreaming={isStreaming}
          isLastPart={isLastPart}
        />
      </PartErrorBoundary>
    );
  }

  // 2. Built-in text part
  if (isTextPart(part)) {
    return <AITextPart part={part} role={role} isStreaming={isStreaming && isLastPart} />;
  }

  // 3. Built-in reasoning part
  if (isReasoningPart(part)) {
    return <AIReasoningPart part={part} isStreaming={isStreaming} />;
  }

  // 4. Tool parts: check tools registry by toolName, fall back to built-in AIToolPart
  if (isToolPart(part)) {
    const toolName = 'toolName' in part ? (part as { toolName?: string }).toolName : undefined;
    if (toolName) {
      const CustomToolComponent = toolsRegistry.get(toolName);
      if (CustomToolComponent) {
        const toolPartProps = part as unknown as { type: string; [key: string]: unknown };
        return (
          <PartErrorBoundary partType={`tool:${toolName}`}>
            <CustomToolComponent
              part={toolPartProps}
              role={role}
              isStreaming={isStreaming}
              isLastPart={isLastPart}
            />
          </PartErrorBoundary>
        );
      }
    }
    return <AIToolPart part={part} isStreaming={isStreaming} />;
  }

  // 5. Handle unknown part types in development
  if (__DEV__) {
    return (
      <View style={style('p-2 rounded-md bg-amber-3 my-1')}>
        <Text style={style('text-xs font-mono text-amber-11')}>Unknown part type: {part.type}</Text>
      </View>
    );
  }

  return null;
};

export default AIPartRenderer;
