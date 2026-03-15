/**
 * AIReasoningPart Component
 *
 * Renders reasoning/thinking content from AI models that expose their thought process.
 * Follows Vue's AiReasoningPart patterns:
 * - Collapsible container with iris (violet) accent
 * - "Thinking..." label during streaming
 * - "View reasoning" label after streaming
 * - Stays collapsed by default (user can expand manually)
 *
 * Uses Radix UI color scales matching Vue:
 * - iris-9: Icon color during streaming
 * - iris-11: Label color during streaming
 * - slate-12: Text content
 */

import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Brain } from 'lucide-react-native';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useThemeColors } from '@infrastructure/theme';
import { useMarkdownTheme } from '@infrastructure/hooks';
import { AICollapsible } from './AICollapsible';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';
import { useAIMarkdownRenderer } from '@presentation/ai-chat/hooks/ai-assistant/useAIMarkdownRenderer';

// Import domain types (single source of truth)
import type { ReasoningPart } from '@domain/types/ai-chat/parts';

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
  /** Optional per-instance markdown renderer override. When not provided, falls back to the
   *  renderer registered in AIChatProvider (via registry.markdownRenderer), or plain <Text> if none. */
  MarkdownRenderer?: React.ComponentType<{
    children: React.ReactNode;
    style?: Record<string, unknown>;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const LABEL_KEYS = {
  streaming: 'AI_ASSISTANT.CHAT.REASONING.THINKING',
  completed: 'AI_ASSISTANT.CHAT.REASONING.VIEW_REASONING',
} as const;

// ============================================================================
// Component
// ============================================================================

export const AIReasoningPart: React.FC<AIReasoningPartProps> = ({
  part,
  isStreaming = false,
  defaultExpanded = false,
  MarkdownRenderer: CustomMarkdownRenderer,
}) => {
  const { style, tokens, getCollapsible } = useAIStyles();
  const { t } = useAIi18n();
  const irisTokens = getCollapsible('iris');
  const { colors } = useThemeColors();
  const registryMarkdownRenderer = useAIMarkdownRenderer();
  // Prop wins over registry (allows per-instance override)
  const ResolvedMarkdownRenderer = CustomMarkdownRenderer ?? registryMarkdownRenderer;

  const reasoningTextColor = colors.slate[12];
  const reasoningCodeBg = colors.slate[3];
  const reasoningLinkColor = colors.blue[9];

  // Shared markdown base styles from hook (smaller font for reasoning)
  const baseMarkdownStyles = useMarkdownTheme({
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0, // Override hook default (0.32) — reasoning uses standard letter spacing
    textColor: reasoningTextColor,
    linkColor: reasoningLinkColor,
    codeBackground: reasoningCodeBg,
    includeCodeStyles: true,
  });

  // AIReasoningPart-specific override: paragraph marginBottom for spacing
  const markdownStyles = useMemo(
    () => ({
      ...baseMarkdownStyles,
      paragraph: {
        ...baseMarkdownStyles.paragraph,
        marginBottom: 4,
      },
      // Reasoning doesn't need list alignItems or fontWeight on icons
      list_item: {
        ...baseMarkdownStyles.list_item,
        alignItems: undefined,
      },
      bullet_list_icon: {
        ...baseMarkdownStyles.bullet_list_icon,
        fontWeight: undefined,
      },
      ordered_list_icon: {
        ...baseMarkdownStyles.ordered_list_icon,
        fontWeight: undefined,
      },
    }),
    [baseMarkdownStyles],
  );

  // Extract reasoning text (handle both 'reasoning' and 'text' fields)
  const reasoningText = useMemo(() => {
    return part.reasoning || part.text || '';
  }, [part]);

  // Dynamic title based on streaming state
  const title = isStreaming ? t(LABEL_KEYS.streaming) : t(LABEL_KEYS.completed);

  // Always render if the part exists — matches web behavior.
  // The part existing in the message means reasoning occurred.

  return (
    <AICollapsible
      title={title}
      accentColor="iris"
      isStreaming={isStreaming}
      defaultExpanded={defaultExpanded}
      icon={<Brain size={14} color={colors.iris[9]} strokeWidth={1.5} />}>
      <ScrollView
        style={style('max-h-64')}
        contentContainerStyle={style('pr-1')}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}>
        {reasoningText ? (
          <View style={{ width: '100%' }}>
            {/* Markdown content for reasoning text */}
            {ResolvedMarkdownRenderer ? (
              <ResolvedMarkdownRenderer
                style={markdownStyles as unknown as Record<string, unknown>}>
                {reasoningText}
              </ResolvedMarkdownRenderer>
            ) : (
              // Fallback: plain text when no markdown renderer is registered.
              // Register one via AIChatProvider registry.markdownRenderer to enable markdown rendering.
              <Text style={markdownStyles.body as object}>{reasoningText}</Text>
            )}
            {/* Streaming cursor matching Vue's accent cursor */}
            {isStreaming && (
              <View style={style('flex-row items-end')}>
                <View style={style('w-1.5 h-3 ml-0.5 rounded-sm', irisTokens.cursor)} />
              </View>
            )}
          </View>
        ) : (
          // Loading state while waiting for content
          <View style={style('flex-row items-center')}>
            <ActivityIndicator size="small" color={colors.iris[9]} style={style('mr-2')} />
            <Text style={style('text-sm font-inter-normal-20 italic', tokens.text.secondary)}>
              {t('AI_ASSISTANT.CHAT.REASONING.PROCESSING')}
            </Text>
          </View>
        )}
      </ScrollView>
    </AICollapsible>
  );
};

export default AIReasoningPart;
