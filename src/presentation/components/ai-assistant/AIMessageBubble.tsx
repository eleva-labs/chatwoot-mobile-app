/**
 * AIMessageBubble Component
 *
 * Renders a single AI chat message with full part-based rendering.
 * Follows the Vue AiChatPanel pattern for splitting message parts:
 *
 * Assistant messages:
 *   - Reasoning parts → rendered OUTSIDE the bubble (collapsible)
 *   - Tool parts → rendered OUTSIDE the bubble (collapsible, deduplicated)
 *   - Text parts → rendered INSIDE the bubble (with markdown)
 *
 * User messages:
 *   - All parts rendered INSIDE the bubble (plain text)
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { tailwind } from '@/theme/tailwind';
import type { AIMessageBubbleProps } from '@/presentation/containers/ai-assistant/types';
import { AIPartRenderer } from '@/presentation/parts/ai-assistant/AIPartRenderer';
import { Avatar } from '@/components-next/common/avatar/Avatar';
import {
  getTextParts,
  getReasoningParts,
  getDeduplicatedToolParts,
  type MessagePart,
} from '@/types/ai-chat/parts';

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  isStreaming,
  avatarName,
  avatarSrc,
}) => {
  const { style, message: getMessageTokens } = useAIStyles();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const messageTokens = getMessageTokens(isUser ? 'user' : 'assistant');

  const parts = (message.parts as MessagePart[] | undefined) ?? [];

  // Split parts by category (only for assistant messages, matching Vue pattern)
  const { reasoningParts, toolParts, textParts } = useMemo(() => {
    if (!isAssistant) {
      return { reasoningParts: [], toolParts: [], textParts: parts };
    }
    return {
      reasoningParts: getReasoningParts(parts),
      toolParts: getDeduplicatedToolParts(parts),
      textParts: getTextParts(parts),
    };
  }, [parts, isAssistant]);

  // Determine if text content exists
  const hasTextContent = useMemo(
    () => textParts.some(p => ('text' in p ? (p.text as string)?.trim() : false)),
    [textParts],
  );

  // Show loading when assistant is streaming but has no text content yet
  const showLoader = isAssistant && isStreaming && !hasTextContent;

  return (
    <View
      style={style('items-end gap-2 px-4 py-2', isUser ? 'flex-row-reverse' : 'flex-row')}
      accessible
      accessibilityRole="text"
      accessibilityLabel={isUser ? 'Your message' : 'AI assistant message'}>
      {/* Avatar */}
      <View style={[style('mb-1'), { flexShrink: 0 }]}>
        <Avatar
          name={avatarName || (isUser ? 'User' : 'AI')}
          src={avatarSrc ? { uri: avatarSrc } : undefined}
          size="xs"
        />
      </View>

      {/* Message content */}
      {isAssistant ? (
        // Assistant: reasoning → tools → text bubble (matching Vue layout)
        <View style={style('flex-col gap-1 flex-1')}>
          {/* Reasoning parts - outside bubble */}
          {reasoningParts.map((part, idx) => (
            <AIPartRenderer
              key={`reasoning-${message.id}-${idx}`}
              part={part}
              role="assistant"
              isStreaming={isStreaming && idx === reasoningParts.length - 1}
              isLastPart={false}
            />
          ))}

          {/* Tool parts - outside bubble */}
          {toolParts.map(part => (
            <AIPartRenderer
              key={`tool-${'toolCallId' in part ? part.toolCallId : message.id}`}
              part={part}
              role="assistant"
              isStreaming={isStreaming}
              isLastPart={false}
            />
          ))}

          {/* Text content - inside bubble */}
          {showLoader ? (
            <View
              style={style(
                'px-4 py-3 rounded-2xl rounded-bl-sm self-start',
                messageTokens.background,
              )}>
              <ActivityIndicator
                size="small"
                color={tailwind.color('text-slate-9') ?? 'rgb(139, 141, 152)'}
              />
            </View>
          ) : hasTextContent ? (
            <View
              style={style(
                'px-4 py-3 rounded-2xl rounded-bl-sm self-start',
                messageTokens.background,
              )}>
              {textParts.map((part, idx) => (
                <AIPartRenderer
                  key={`text-${message.id}-${idx}`}
                  part={part}
                  role="assistant"
                  isStreaming={isStreaming && idx === textParts.length - 1}
                  isLastPart={idx === textParts.length - 1}
                />
              ))}
            </View>
          ) : null}

          {/* Message actions for assistant (disabled placeholders) */}
          {isAssistant && hasTextContent && !isStreaming && (
            <View style={style('flex-row items-center gap-0.5 mt-1')}>
              <Pressable disabled style={style('p-1.5 rounded-md opacity-50')}>
                <Text style={style('text-xs text-slate-10')}>Copy</Text>
              </Pressable>
              <Pressable disabled style={style('p-1.5 rounded-md opacity-50')}>
                <Text style={style('text-xs text-slate-10')}>Regenerate</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        // User: all parts inside bubble
        <View style={style('flex-col items-end flex-1')}>
          <View
            style={style(
              'px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%]',
              messageTokens.background,
            )}>
            {parts.length > 0 ? (
              parts.map((part, idx) => (
                <AIPartRenderer
                  key={`user-${message.id}-${idx}`}
                  part={part}
                  role="user"
                  isStreaming={false}
                  isLastPart={idx === parts.length - 1}
                />
              ))
            ) : (
              // Fallback: render content string directly if no parts
              <AIPartRenderer
                part={{
                  type: 'text',
                  text: String((message as unknown as Record<string, unknown>).content ?? ''),
                }}
                role="user"
                isStreaming={false}
                isLastPart
              />
            )}
          </View>
          {/* Spacer to match assistant action buttons height */}
          <View style={style('h-7')} />
        </View>
      )}
    </View>
  );
};
