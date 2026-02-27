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
import type { ToolPart, ToolCallPart, ToolResultPart } from '@/types/ai-chat/parts';
import type { ToolState } from '@/types/ai-chat/constants';
import { PART_TYPES } from '@/types/ai-chat/constants';
import { deriveToolDisplayState } from '@/types/ai-chat/parts';

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

/**
 * Tool state to display configuration mapping.
 *
 * NOTE: The web Vue implementation uses neutral 'slate' accent for all tool states.
 * The mobile uses state-based colors (slate/teal/ruby) for better UX feedback.
 * This is an intentional divergence from web for improved mobile readability.
 */
// TODO: Replace emoji icons with Lucide icons (wrench, clock, check-circle, x-circle)
// when icon library is migrated
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

  // Get input and output content separately
  const hasInput = useMemo(() => {
    return 'args' in part && part.args != null;
  }, [part]);

  const hasOutput = useMemo(() => {
    return 'result' in part && (part as ToolResultPart).result !== undefined;
  }, [part]);

  const inputData = useMemo(() => {
    return hasInput ? (part as ToolCallPart).args : null;
  }, [part, hasInput]);

  const outputData = useMemo(() => {
    return hasOutput ? (part as ToolResultPart).result : null;
  }, [part, hasOutput]);

  // Also check for toolName from output
  const toolName = useMemo(() => {
    const name = part.toolName || ((part as any).output?.tool_name as string) || 'Unknown Tool';
    return formatToolName(name);
  }, [part.toolName, part]);

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
        {/* Input section */}
        {hasInput && (
          <View style={hasOutput ? style('mb-3') : undefined}>
            <Text
              style={style(
                'text-xs font-inter-semibold-20 mb-2 uppercase',
                tokens.tool.sectionLabel,
              )}>
              Input
            </Text>
            <ScrollView
              style={style('max-h-48')}
              horizontal={false}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              <View style={style('p-2 rounded-md', tokens.tool.jsonBackground)}>
                <Text style={style('text-xs font-mono', tokens.tool.jsonText)} selectable>
                  {formatJson(inputData)}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Output section */}
        {hasOutput && (
          <View>
            <Text
              style={style(
                'text-xs font-inter-semibold-20 mb-2 uppercase',
                tokens.tool.sectionLabel,
              )}>
              Output
            </Text>
            <ScrollView
              style={style('max-h-48')}
              horizontal={false}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              <View style={style('p-2 rounded-md', tokens.tool.jsonBackground)}>
                <Text style={style('text-xs font-mono', tokens.tool.jsonText)} selectable>
                  {formatJson(outputData)}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Fallback: show something if neither input nor output */}
        {!hasInput && !hasOutput && (
          <Text style={style('text-xs italic', tokens.text.muted)}>No data available</Text>
        )}

        {/* Error message for error state */}
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
