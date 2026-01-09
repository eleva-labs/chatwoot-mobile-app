import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import type { AIMessageBubbleProps } from '@/presentation/containers/ai-assistant/types';
// Use domain constants and helpers instead of hardcoded strings
import { PART_TYPES } from '@/domain/types/ai-assistant/constants';
import { isTextPart, type MessagePart } from '@/domain/types/ai-assistant/parts';

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({ message, isStreaming }) => {
  const { style, message: getMessageTokens, getCursor } = useAIStyles();
  const isUser = message.role === 'user';
  const messageTokens = getMessageTokens(isUser ? 'user' : 'assistant');
  const cursorToken = getCursor(isUser ? 'user' : 'assistant');

  // Extract text content from message parts
  // Handle both streaming and completed messages safely
  const textContent = React.useMemo(() => {
    try {
      // First, try to get content from parts array (Vercel AI SDK format)
      if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
        const extracted = message.parts
          .filter(part => {
            // Strictly filter: part must exist, be an object, and have a type
            return part != null && typeof part === 'object' && part !== null && 'type' in part;
          })
          .map(part => {
            try {
              // Double-check part is valid before accessing properties
              if (!part || typeof part !== 'object') {
                return '';
              }

              // Use domain type guard instead of hardcoded string
              if (isTextPart(part as MessagePart)) {
                // Handle both 'text' and 'content' properties (Vercel AI SDK variations)
                // Also check for 'delta' which might be used during streaming
                // Use optional chaining and nullish coalescing for safety
                const partRecord = part as Record<string, unknown>;
                const text = typeof partRecord.text === 'string' ? partRecord.text : undefined;
                const content =
                  typeof partRecord.content === 'string' ? partRecord.content : undefined;
                const delta = typeof partRecord.delta === 'string' ? partRecord.delta : undefined;
                const result = text ?? content ?? delta ?? '';

                if (__DEV__ && part.type === PART_TYPES.TEXT && !result && !isStreaming) {
                  console.warn(
                    '[AIMessageBubble] Part has type "text" but no text/content/delta:',
                    {
                      part,
                      hasText: 'text' in part,
                      hasContent: 'content' in part,
                      hasDelta: 'delta' in part,
                      partKeys: Object.keys(part || {}),
                    },
                  );
                }
                return result;
              }
              return '';
            } catch (error) {
              console.error('[AIMessageBubble] Error extracting text from part:', error, {
                part,
                partType: typeof part,
                partKeys: part ? Object.keys(part) : 'null/undefined',
              });
              return '';
            }
          })
          .filter(text => text !== '') // Remove empty strings
          .join('');

        if (extracted) {
          return extracted;
        }
      }

      // Fallback: check if message has content directly (alternative format)
      const messageRecord = message as unknown as Record<string, unknown>;
      if (messageRecord.content && typeof messageRecord.content === 'string') {
        return messageRecord.content;
      }
      return '';
    } catch (error) {
      console.error('[AIMessageBubble] Error extracting text content:', error, message);
      return '';
    }
  }, [message, isStreaming]);

  // Show loading indicator for empty assistant messages that are streaming
  const showLoading = !isUser && !textContent && isStreaming;
  // Show cursor for streaming messages with content
  const showCursor = !isUser && textContent && isStreaming;

  // Animate cursor opacity for blinking effect
  const cursorOpacity = useSharedValue(1);
  useEffect(() => {
    if (showCursor) {
      cursorOpacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true);
    } else {
      cursorOpacity.value = 1;
    }
  }, [showCursor, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View
      style={style('mb-3', isUser ? 'items-end' : 'items-start')}
      accessible
      accessibilityRole="text"
      accessibilityLabel={isUser ? 'Your message' : 'AI assistant message'}
    >
      <View
        style={style(
          'px-4 py-3 rounded-2xl max-w-[80%] flex-row items-center',
          messageTokens.background,
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm',
        )}
      >
        {showLoading ? (
          <ActivityIndicator size="small" color={Platform.OS === 'ios' ? '#4B5563' : '#9CA3AF'} />
        ) : textContent ? (
          <>
            <Text style={style('text-base font-inter-normal-20 leading-5', messageTokens.text)}>
              {textContent}
            </Text>
            {showCursor && (
              <Animated.View style={[style('w-0.5 h-4 ml-1', cursorToken), cursorStyle]} />
            )}
          </>
        ) : (
          // Fallback: Show placeholder if text extraction failed
          <Text
            style={style(
              'text-base font-inter-normal-20 leading-5 italic opacity-70',
              messageTokens.text,
            )}
          >
            {__DEV__ ? `[Message ${message.id || 'no-id'}]` : '...'}
          </Text>
        )}
      </View>
    </View>
  );
};
