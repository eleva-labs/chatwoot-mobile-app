/**
 * AITextPart Component
 *
 * Renders text content from AI message parts with markdown support and streaming cursor.
 * Follows Vue's AiTextPart patterns:
 * - Markdown rendering for formatted text
 * - Blinking cursor during streaming
 * - Role-based text styling
 *
 * Uses Radix UI color scales matching Vue:
 * - User messages: iris-12 text (displayed on iris-3 background)
 * - Assistant messages: slate-12 text (displayed on slate-3 background)
 * - Links: blue-9 for visibility
 * - Cursor: slate-9 for assistant
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@infrastructure/context/ThemeContext';
import { useThemeColors } from '@infrastructure/theme';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useAIMarkdownRenderer } from '@presentation/ai-chat/hooks/ai-assistant/useAIMarkdownRenderer';

// Import domain types (single source of truth)
import type { TextPart } from '@domain/types/ai-chat/parts';

// Re-export for convenience
export type { TextPart };

// ============================================================================
// Types
// ============================================================================

export interface AITextPartProps {
  /** The text part to render */
  part: TextPart;
  /** Role of the message (affects styling) */
  role?: 'user' | 'assistant';
  /** Whether this part is currently streaming */
  isStreaming?: boolean;
  /** Whether to render markdown or plain text */
  enableMarkdown?: boolean;
  /** Optional custom markdown renderer. Default: react-native-markdown-display */
  MarkdownRenderer?: React.ComponentType<{ children: string; style?: Record<string, unknown> }>;
}

// ============================================================================
// Constants
// ============================================================================

const CURSOR_BLINK_DURATION = 500;

// ============================================================================
// Component
// ============================================================================

export const AITextPart: React.FC<AITextPartProps> = ({
  part,
  role = 'assistant',
  isStreaming = false,
  enableMarkdown = true,
  MarkdownRenderer: CustomMarkdownRenderer,
}) => {
  const { style } = useAIStyles();
  const { themeVersion } = useTheme();
  const { colors } = useThemeColors();
  const registryMarkdownRenderer = useAIMarkdownRenderer();
  // Prop wins over registry (allows per-instance override)
  const ResolvedMarkdownRenderer = CustomMarkdownRenderer ?? registryMarkdownRenderer;

  const isUser = role === 'user';
  const text = part.text || '';

  // Cursor animation
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    if (isStreaming) {
      cursorOpacity.value = withRepeat(
        withTiming(0, { duration: CURSOR_BLINK_DURATION }),
        -1,
        true,
      );
    } else {
      cursorOpacity.value = 0;
    }
  }, [isStreaming, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  // Workaround for react-native-markdown-display Yoga height under-reporting:
  // The library's body View under-measures its height when paragraphs use
  // flex-row + flex-wrap. We measure the actual rendered height via onLayout
  // and set minHeight on the outer container to prevent clipping.
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const handleInnerLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight(prev => (prev === undefined || h > prev ? h : prev));
  }, []);

  // Reset measured height when text changes (e.g. message reuse or update)
  useEffect(() => {
    setContentHeight(undefined);
  }, [text]);

  // Get colors from theme context (extraction-ready)
  // User: iris-12 text on iris-3 background
  // Assistant: slate-12 text on slate-3 background
  const textColor = isUser ? colors.iris[12] : colors.slate[12];
  const linkColor = colors.blue[9];
  // White overlay with 15% opacity for readability on iris-3 user message background
  const codeBackground = isUser ? 'rgba(255,255,255,0.15)' : colors.slate[3];
  const cursorColor = isUser ? colors.iris[12] : colors.slate[9];

  // Markdown styles based on role using Radix colors (memoized for performance)
  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          fontSize: 15,
          lineHeight: 22,
          letterSpacing: 0.2,
          color: textColor,
          fontFamily: 'Inter-400-20',
          // Small safety margin; the onLayout minHeight fix handles the main
          // Yoga height under-reporting issue.
          paddingBottom: 4,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 0,
          // Defense-in-depth: override the library's flex-row+wrap default to
          // reduce Yoga height mis-measurement on paragraphs.
          flexDirection: 'column',
          flexWrap: 'nowrap',
        },
        strong: {
          fontFamily: 'Inter-600-20',
          fontWeight: '600',
        },
        em: {
          fontStyle: 'italic',
        },
        code_inline: {
          backgroundColor: codeBackground,
          borderRadius: 4,
          paddingHorizontal: 4,
          fontFamily: 'monospace',
          fontSize: 13,
        },
        code_block: {
          backgroundColor: codeBackground,
          borderRadius: 8,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
        },
        fence: {
          backgroundColor: codeBackground,
          borderRadius: 8,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
        },
        link: {
          color: linkColor,
          textDecorationLine: 'underline',
        },
        bullet_list: {
          minWidth: 200,
        },
        ordered_list: {
          minWidth: 200,
        },
        list_item: {
          flexDirection: 'row',
          justifyContent: 'flex-start',
        },
        bullet_list_icon: {
          marginLeft: 0,
          marginRight: 8,
          color: textColor,
        },
      }),
    // themeVersion ensures styles recompute when tailwind is rebuilt
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textColor, linkColor, codeBackground, themeVersion],
  );

  // If no text and not streaming, return null
  if (!text && !isStreaming) {
    return null;
  }

  // Render plain text for user messages or when markdown is disabled
  if (isUser || !enableMarkdown) {
    return (
      <View style={style('flex-row items-end')}>
        <Text style={[style('text-base font-inter-normal-20 leading-5'), { color: textColor }]}>
          {text}
        </Text>
        {isStreaming && (
          <Animated.View
            style={[
              style('w-2 h-4 ml-0.5 rounded-sm'),
              { backgroundColor: cursorColor },
              cursorStyle,
            ]}
          />
        )}
      </View>
    );
  }

  // Render markdown for assistant messages
  return (
    <View style={contentHeight ? { minHeight: contentHeight } : undefined}>
      <View onLayout={handleInnerLayout}>
        {ResolvedMarkdownRenderer ? (
          <ResolvedMarkdownRenderer style={markdownStyles as unknown as Record<string, unknown>}>
            {text}
          </ResolvedMarkdownRenderer>
        ) : (
          // Fallback: plain text when no markdown renderer is registered.
          // Register one via AIChatProvider registry.markdownRenderer to enable markdown rendering.
          <Text style={markdownStyles.body as object}>{text}</Text>
        )}
      </View>
      {isStreaming && (
        <View style={style('flex-row justify-start')}>
          <Animated.View
            style={[
              style('w-2 h-4 ml-0.5 rounded-sm'),
              { backgroundColor: cursorColor },
              cursorStyle,
            ]}
          />
        </View>
      )}
    </View>
  );
};

export default AITextPart;
