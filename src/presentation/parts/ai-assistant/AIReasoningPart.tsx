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
import { View, ScrollView, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { tailwind } from '@/theme/tailwind';
import { useTheme } from '@/context/ThemeContext';
import { AICollapsible } from './AICollapsible';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';

// Import domain types (single source of truth)
import type { ReasoningPart } from '@/types/ai-chat/parts';

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
  /** Optional custom markdown renderer. Default: react-native-markdown-display */
  MarkdownRenderer?: React.ComponentType<{ children: string; style?: Record<string, unknown> }>;
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
  const { themeVersion } = useTheme();

  // Markdown styles for reasoning content (smaller than main text)
  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          fontSize: 13,
          lineHeight: 19,
          color: tailwind.color('text-slate-12') ?? 'rgb(28, 32, 36)',
          fontFamily: 'Inter-400-20',
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 4,
        },
        strong: {
          fontFamily: 'Inter-600-20',
          fontWeight: '600',
        },
        em: {
          fontStyle: 'italic',
        },
        code_inline: {
          backgroundColor: tailwind.color('bg-slate-3') ?? 'rgb(240, 240, 243)',
          borderRadius: 4,
          paddingHorizontal: 4,
          fontFamily: 'monospace',
          fontSize: 12,
        },
        link: {
          color: tailwind.color('text-blue-9') ?? 'rgb(39, 129, 246)',
          textDecorationLine: 'underline',
        },
      }),
    // themeVersion ensures styles recompute when tailwind is rebuilt
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeVersion],
  );

  // Extract reasoning text (handle both 'reasoning' and 'text' fields)
  const reasoningText = useMemo(() => {
    return part.reasoning || part.text || '';
  }, [part]);

  // Dynamic title based on streaming state
  const title = isStreaming ? t(LABEL_KEYS.streaming) : t(LABEL_KEYS.completed);

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
        isStreaming ? (
          <ActivityIndicator
            size="small"
            color={tailwind.color('text-iris-9') ?? 'rgb(91, 91, 214)'}
          />
        ) : (
          <View
            style={[
              style('w-2.5 h-2.5 rounded-full', irisTokens.iconActive ? 'bg-iris-9' : 'bg-slate-9'),
            ]}
          />
        )
      }>
      <ScrollView
        style={style('max-h-64')}
        contentContainerStyle={style('pr-1')}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}>
        {reasoningText ? (
          <View style={{ width: '100%' }}>
            {/* Markdown content for reasoning text */}
            {CustomMarkdownRenderer ? (
              <CustomMarkdownRenderer style={markdownStyles as unknown as Record<string, unknown>}>
                {reasoningText}
              </CustomMarkdownRenderer>
            ) : (
              <Markdown
                mergeStyle
                markdownit={MarkdownIt({ linkify: true, typographer: true })}
                style={markdownStyles}>
                {reasoningText}
              </Markdown>
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
            <ActivityIndicator
              size="small"
              color={tailwind.color('text-iris-9') ?? 'rgb(91, 91, 214)'}
              style={style('mr-2')}
            />
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
