/**
 * AIReasoningPart Component
 *
 * Renders reasoning/thinking content from AI models that expose their thought process.
 * Follows Vue's AiReasoningPart patterns:
 * - Collapsible container with iris (violet) accent
 * - "Thinking..." label during streaming
 * - "View reasoning" label after streaming
 * - Auto-expands during streaming
 *
 * Uses Radix UI color scales matching Vue:
 * - iris-9: Icon color during streaming
 * - iris-11: Label color during streaming
 * - slate-12: Text content
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { AICollapsible } from './AICollapsible';

// Import domain types (single source of truth)
import type { ReasoningPart } from '@/domain/types/ai-assistant/parts';

// Re-export for convenience
export type { ReasoningPart };

// ============================================================================
// Types
// ============================================================================

export interface AIReasoningPartProps {
  /** The reasoning part to render */
  part: ReasoningPart;
  /** Whether this part is currently streaming */
  isStreaming?: boolean;
  /** Whether to start expanded (Vue defaults to false, we match that) */
  defaultExpanded?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const LABELS = {
  streaming: 'Thinking...',
  completed: 'View reasoning',
} as const;

// ============================================================================
// Component
// ============================================================================

export const AIReasoningPart: React.FC<AIReasoningPartProps> = ({
  part,
  isStreaming = false,
  defaultExpanded = false, // Match Vue's autoExpandOnStream: false default
}) => {
  const { style, tokens, getCollapsible } = useAIStyles();
  const irisTokens = getCollapsible('iris');

  // Extract reasoning text (handle both 'reasoning' and 'text' fields)
  const reasoningText = useMemo(() => {
    return part.reasoning || part.text || '';
  }, [part]);

  // Dynamic title based on streaming state
  const title = isStreaming ? LABELS.streaming : LABELS.completed;

  // Don't render if no content and not streaming
  if (!reasoningText && !isStreaming) {
    return null;
  }

  return (
    <AICollapsible
      title={title}
      accentColor="iris"
      isStreaming={isStreaming}
      defaultExpanded={defaultExpanded}
      icon={
        // Vue uses i-lucide-brain icon
        <Text style={style(irisTokens.iconActive)}>🧠</Text>
      }
    >
      <ScrollView
        style={style('max-h-64')}
        contentContainerStyle={style('pr-1')}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {reasoningText ? (
          <View style={style('flex-row flex-wrap items-end')}>
            {/* Text content using slate-12 like Vue's prose */}
            <Text style={style('text-sm font-inter-normal-20 leading-5', tokens.text.primary)}>
              {reasoningText}
            </Text>
            {/* Streaming cursor matching Vue's accent cursor */}
            {isStreaming && (
              <View style={style('w-1.5 h-3 ml-0.5 rounded-sm', irisTokens.cursor)} />
            )}
          </View>
        ) : (
          // Loading state while waiting for content
          <View style={style('flex-row items-center')}>
            <ActivityIndicator
              size="small"
              color="#5B5BD6" // iris-9
              style={style('mr-2')}
            />
            <Text style={style('text-sm font-inter-normal-20 italic', tokens.text.secondary)}>
              Processing...
            </Text>
          </View>
        )}
      </ScrollView>
    </AICollapsible>
  );
};

export default AIReasoningPart;
