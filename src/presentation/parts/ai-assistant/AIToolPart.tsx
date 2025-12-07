/**
 * AIToolPart Component
 *
 * Renders tool call and tool result parts from AI messages.
 * Follows Vue's AiToolPart patterns:
 * - Shows tool name and state (pending/running/completed/error)
 * - Displays tool input and output in collapsible sections
 * - Different styling based on tool state
 *
 * Uses Radix UI color scales matching Vue:
 * - slate: pending/running states (neutral)
 * - teal: completed state (success)
 * - ruby: error state (error)
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { useAIStyles, type AIAccentColor } from '@/presentation/styles/ai-assistant';
import { AICollapsible } from './AICollapsible';

// Import domain types and constants (single source of truth)
import type { ToolPart, ToolCallPart, ToolResultPart } from '@/domain/types/ai-assistant/parts';
import type { ToolState } from '@/domain/types/ai-assistant/constants';
import { PART_TYPES } from '@/domain/types/ai-assistant/constants';
import { deriveToolDisplayState } from '@/domain/types/ai-assistant/parts';

// Re-export for convenience
export type { ToolPart, ToolCallPart, ToolResultPart, ToolState };

// ============================================================================
// Types
// ============================================================================

export interface AIToolPartProps {
  /** The tool part to render */
  part: ToolPart;
  /** Whether this part is currently streaming */
  isStreaming?: boolean;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
}

// ============================================================================
// Types for Display Configuration
// ============================================================================

type DisplayState = 'pending' | 'running' | 'completed' | 'error';

interface StateDisplayConfig {
  icon: string;
  label: string;
  accentColor: AIAccentColor;
}

// ============================================================================
// Constants (Matching Vue's color mapping)
// ============================================================================

const STATE_CONFIG: Record<DisplayState, StateDisplayConfig> = {
  pending: {
    icon: '⏳',
    label: 'Pending',
    accentColor: 'slate', // Neutral state
  },
  running: {
    icon: '⚙️',
    label: 'Running',
    accentColor: 'slate', // Neutral state with streaming
  },
  completed: {
    icon: '✅',
    label: 'Completed',
    accentColor: 'teal', // Success state (matches Vue's teal)
  },
  error: {
    icon: '❌',
    label: 'Error',
    accentColor: 'ruby', // Error state (matches Vue's ruby)
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format tool name for display
 * Converts snake_case or camelCase to Title Case
 */
function formatToolName(name: string): string {
  if (!name) return 'Unknown Tool';

  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Safely stringify JSON with proper formatting
 */
function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Map domain ToolState to display state
 * Domain uses granular states, UI uses simplified states
 */
function mapToDisplayState(domainState: ToolState): DisplayState {
  switch (domainState) {
    case 'input-streaming':
    case 'running':
      return 'running';
    case 'input-available':
    case 'pending':
      return 'pending';
    case 'output-available':
    case 'completed':
      return 'completed';
    case 'output-error':
    case 'failed':
      return 'error';
    default:
      return 'pending';
  }
}

/**
 * Determine display state from part using domain helper
 */
function getDisplayState(part: ToolPart): DisplayState {
  const domainState = deriveToolDisplayState(part);
  return mapToDisplayState(domainState);
}

// ============================================================================
// Component
// ============================================================================

export const AIToolPart: React.FC<AIToolPartProps> = ({
  part,
  isStreaming = false,
  defaultExpanded = false,
}) => {
  const { style, tokens } = useAIStyles();

  // Derive state and display configuration using domain helper
  const state = useMemo(() => getDisplayState(part), [part]);
  const config = STATE_CONFIG[state];

  // Get tool name and format it (handle optional toolName)
  const toolName = useMemo(() => {
    return formatToolName(part.toolName || 'Unknown Tool');
  }, [part.toolName]);

  // Get input/output content (handle optional args/result)
  // Uses domain PART_TYPES constants instead of hardcoded strings
  const content = useMemo(() => {
    const isToolInput =
      part.type === PART_TYPES.TOOL_CALL ||
      part.type === PART_TYPES.TOOL_INVOCATION ||
      part.type === PART_TYPES.TOOL_INPUT_AVAILABLE ||
      part.type === PART_TYPES.TOOL_INPUT_STREAMING;

    if (isToolInput) {
      return {
        label: 'Input',
        data: (part as ToolCallPart).args || {},
      };
    }
    return {
      label: 'Output',
      data: (part as ToolResultPart).result ?? null,
    };
  }, [part]);

  // Build title with state
  const title = `${toolName} • ${config.label}`;

  return (
    <AICollapsible
      title={title}
      accentColor={config.accentColor}
      isStreaming={isStreaming && state === 'running'}
      defaultExpanded={defaultExpanded}
      icon={<Text>{config.icon}</Text>}>
      <View>
        {/* Content label using slate colors */}
        <Text
          style={style('text-xs font-inter-semibold-20 mb-2 uppercase', tokens.tool.sectionLabel)}>
          {content.label}
        </Text>

        {/* JSON content with slate background */}
        <ScrollView
          style={style('max-h-48')}
          horizontal={false}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}>
          <View style={style('p-2 rounded-md', tokens.tool.jsonBackground)}>
            <Text style={style('text-xs font-mono', tokens.tool.jsonText)} selectable>
              {formatJson(content.data)}
            </Text>
          </View>
        </ScrollView>

        {/* Error message for error state using ruby colors */}
        {state === 'error' && part.type === PART_TYPES.TOOL_RESULT && (
          <View style={style('mt-2 p-2 rounded-md', tokens.tool.errorBackground)}>
            <Text style={style('text-xs font-inter-medium-24', tokens.tool.errorText)}>
              Tool execution failed
            </Text>
          </View>
        )}
      </View>
    </AICollapsible>
  );
};

export default AIToolPart;
