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

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import { useThemeColors } from '@/theme';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

// Import domain types (single source of truth)
import type { TextPart } from '@/domain/types/ai-assistant/parts';

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
}) => {
  const { style } = useAIStyles();
  const { colors } = useThemeColors();

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

  // Handle URL presses in markdown
  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.warn('[AITextPart] Failed to open URL:', err);
    });
    return true;
  };

  // Get colors from Radix scale based on role
  // User: iris-12 text on iris-3 background
  // Assistant: slate-12 text on slate-3 background
  const textColor = isUser ? colors.iris[12] : colors.slate[12];
  const linkColor = colors.blue[9];
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
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 0,
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
    [textColor, linkColor, codeBackground],
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
              style('w-0.5 h-4 ml-1 rounded-sm'),
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
    <View style={style('flex-row items-end')}>
      <View style={style('flex-1')}>
        <Markdown
          mergeStyle
          markdownit={MarkdownIt({
            linkify: true,
            typographer: true,
          })}
          onLinkPress={handleLinkPress}
          style={markdownStyles}>
          {text}
        </Markdown>
      </View>
      {isStreaming && (
        <Animated.View
          style={[
            style('w-0.5 h-4 ml-1 rounded-sm'),
            { backgroundColor: cursorColor },
            cursorStyle,
          ]}
        />
      )}
    </View>
  );
};

export default AITextPart;
