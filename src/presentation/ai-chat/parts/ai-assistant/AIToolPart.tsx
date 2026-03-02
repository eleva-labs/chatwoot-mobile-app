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

import { CircleCheck, CircleX, Wrench, LoaderCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';
import { useAIStyles, type AIAccentColor } from '@presentation/ai-chat/styles/ai-assistant';
import { AICollapsible } from './AICollapsible';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';
import {
  formatToolName,
  formatJson,
} from '@presentation/ai-chat/utils/ai-assistant/aiChatFormatUtils';

// Import domain types and constants (single source of truth)
import type { ToolPart, ToolCallPart, ToolResultPart } from '@domain/types/ai-chat/parts';
import type { ToolState } from '@domain/types/ai-chat/constants';
import { PART_TYPES } from '@domain/types/ai-chat/constants';
import { deriveToolDisplayState } from '@domain/types/ai-chat/parts';

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

interface StateDisplayData {
  iconName: 'wrench' | 'loader' | 'check' | 'close';
  iconColorToken: string;
  iconColorFallback: string;
  labelKey: string;
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
 *
 * Data-only config — JSX is created at render time by renderStateIcon().
 */
const STATE_DATA: Record<DisplayState, StateDisplayData> = {
  pending: {
    iconName: 'wrench',
    iconColorToken: 'slate-10',
    iconColorFallback: '#80838D',
    labelKey: 'AI_ASSISTANT.CHAT.TOOLS.PENDING',
    accentColor: 'slate',
  },
  running: {
    iconName: 'loader',
    iconColorToken: 'slate-10',
    iconColorFallback: '#80838D',
    labelKey: 'AI_ASSISTANT.CHAT.TOOLS.RUNNING',
    accentColor: 'slate',
  },
  completed: {
    iconName: 'check',
    iconColorToken: 'teal-9',
    iconColorFallback: '#12A594',
    labelKey: 'AI_ASSISTANT.CHAT.TOOLS.COMPLETED',
    accentColor: 'teal',
  },
  error: {
    iconName: 'close',
    iconColorToken: 'ruby-9',
    iconColorFallback: '#E5484D',
    labelKey: 'AI_ASSISTANT.CHAT.TOOLS.ERROR',
    accentColor: 'ruby',
  },
};

/**
 * Create the icon element at render time (theme-aware).
 * Called inside useMemo so icons update when theme changes.
 */
function renderStateIcon(
  data: StateDisplayData,
  colors: ReturnType<typeof useThemeColors>['colors'],
): React.ReactNode {
  const colorParts = data.iconColorToken.split('-');
  const scale = colorParts[0] as 'slate' | 'teal' | 'ruby';
  const step = parseInt(colorParts[1], 10) as 9 | 10;
  const color = colors[scale][step];
  const iconProps = { size: 14, color, strokeWidth: 1.5 };
  const iconMap = {
    wrench: <Wrench {...iconProps} />,
    loader: <LoaderCircle {...iconProps} />,
    check: <CircleCheck {...iconProps} />,
    close: <CircleX {...iconProps} />,
  };
  return iconMap[data.iconName];
}

// ============================================================================
// Helper Functions
// ============================================================================

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
  const { t } = useAIi18n();
  const { colors } = useThemeColors();

  // Derive state and display configuration using domain helper
  const state = useMemo(() => getDisplayState(part), [part]);
  const data = STATE_DATA[state];
  const iconElement = useMemo(() => renderStateIcon(data, colors), [data, colors]);

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
    const name =
      part.toolName ||
      ((part as ToolResultPart & { output?: { tool_name?: string } }).output
        ?.tool_name as string) ||
      '';
    return formatToolName(name, t('AI_ASSISTANT.CHAT.TOOLS.UNKNOWN_TOOL'));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- part.toolName is extracted from part
  }, [part, t]);

  // Build title — show only tool name (state is conveyed by icon color)
  const title = toolName;

  return (
    <AICollapsible
      title={title}
      accentColor={data.accentColor}
      isStreaming={isStreaming && state === 'running'}
      defaultExpanded={defaultExpanded}
      icon={iconElement}>
      <View>
        {/* Input section */}
        {hasInput && (
          <View style={hasOutput ? style('mb-3') : undefined}>
            <Text
              style={style(
                'text-xs font-inter-semibold-20 mb-2 uppercase',
                tokens.tool.sectionLabel,
              )}>
              {t('AI_ASSISTANT.CHAT.TOOLS.INPUT')}
            </Text>
            <ScrollView
              style={style('max-h-48')}
              horizontal={false}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              <View style={style('p-3 rounded-lg', tokens.tool.jsonBackground)}>
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
              {t('AI_ASSISTANT.CHAT.TOOLS.OUTPUT')}
            </Text>
            <ScrollView
              style={style('max-h-48')}
              horizontal={false}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              <View style={style('p-3 rounded-lg', tokens.tool.jsonBackground)}>
                <Text style={style('text-xs font-mono', tokens.tool.jsonText)} selectable>
                  {formatJson(outputData)}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Fallback: show something if neither input nor output */}
        {!hasInput && !hasOutput && (
          <Text style={style('text-xs italic', tokens.text.muted)}>
            {t('AI_ASSISTANT.CHAT.TOOLS.NO_DATA')}
          </Text>
        )}

        {/* Error message for error state */}
        {state === 'error' && part.type === PART_TYPES.TOOL_RESULT && (
          <View style={style('mt-2 p-2 rounded-md', tokens.tool.errorBackground)}>
            <Text style={style('text-xs font-inter-medium-24', tokens.tool.errorText)}>
              {t('AI_ASSISTANT.CHAT.TOOLS.EXECUTION_FAILED')}
            </Text>
          </View>
        )}
      </View>
    </AICollapsible>
  );
};

export default AIToolPart;
