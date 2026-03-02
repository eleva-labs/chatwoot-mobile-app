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
import { View, Pressable, ActivityIndicator, Text } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useHaptic } from '@infrastructure/utils';
import { Copy } from 'lucide-react-native';
import { TickIcon } from '@/svg-icons/common/TickIcon';
import { useAIStyles } from '@presentation/ai-chat/styles/ai-assistant';
import { useResolveColor } from '@presentation/ai-chat/hooks/ai-assistant/useAITheme';
import type { AIMessageBubbleProps } from '@presentation/ai-chat/containers/ai-assistant/types';
import { AIPartRenderer } from '@presentation/ai-chat/parts/ai-assistant/AIPartRenderer';
import { Avatar } from '@infrastructure/ui/common/avatar/Avatar';
import {
  getTextParts,
  getReasoningParts,
  getDeduplicatedToolParts,
  type MessagePart,
} from '@domain/types/ai-chat/parts';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';
import { useTheme } from '@infrastructure/context/ThemeContext';
import { getAvatarColorsByName, getAvatarInitials } from '@infrastructure/theme/colors/avatar';

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  isStreaming,
  avatarName,
  avatarSrc,
  renderAvatar: renderAvatarProp,
  onCopy: onCopyProp,
  onHaptic: onHapticProp,
}) => {
  const { style, message: getMessageTokens } = useAIStyles();
  const { t } = useAIi18n();
  const resolveColor = useResolveColor();
  const { isDark } = useTheme();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const defaultHaptic = useHaptic('success');
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const messageTokens = getMessageTokens(isUser ? 'user' : 'assistant');

  // Compute avatar colors for non-user messages (matches web AVATAR_COLORS)
  const avatarColors = useMemo(
    () => getAvatarColorsByName(avatarName, isDark),
    [avatarName, isDark],
  );

  const parts = useMemo(() => (message.parts as MessagePart[] | undefined) ?? [], [message.parts]);

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
      accessibilityLabel={
        isUser
          ? t('AI_ASSISTANT.CHAT.ACCESSIBILITY.USER_MESSAGE')
          : t('AI_ASSISTANT.CHAT.ACCESSIBILITY.AI_MESSAGE')
      }>
      {/* Avatar */}
      <View style={[style('mb-1'), { flexShrink: 0 }]}>
        {renderAvatarProp ? (
          renderAvatarProp({
            name:
              avatarName ||
              (isUser
                ? t('AI_ASSISTANT.CHAT.ACCESSIBILITY.USER_MESSAGE')
                : t('AI_ASSISTANT.CHAT.AVATAR_NAME')),
            src: avatarSrc,
            size: 28,
          })
        ) : avatarSrc ? (
          <Avatar
            name={
              avatarName ||
              (isUser
                ? t('AI_ASSISTANT.CHAT.ACCESSIBILITY.USER_MESSAGE')
                : t('AI_ASSISTANT.CHAT.AVATAR_NAME'))
            }
            src={{ uri: avatarSrc }}
            size="lg"
          />
        ) : (
          <View
            style={[
              style('w-7 h-7 rounded-full items-center justify-center'),
              { backgroundColor: avatarColors.bg },
            ]}>
            <Text
              style={[style('text-sm font-inter-medium-24'), { color: avatarColors.text }]}
              allowFontScaling={false}>
              {getAvatarInitials(
                avatarName ||
                  (isUser
                    ? t('AI_ASSISTANT.CHAT.ACCESSIBILITY.USER_MESSAGE')
                    : t('AI_ASSISTANT.CHAT.AVATAR_NAME')),
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Message content */}
      {isAssistant ? (
        // Assistant: reasoning → tools → text bubble (matching Vue layout)
        <View style={style('flex-col gap-1 w-4/5')}>
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
                'px-4 py-2 rounded-2xl rounded-bl-sm overflow-hidden',
                messageTokens.background,
              )}>
              <ActivityIndicator
                size="small"
                color={resolveColor('text-slate-9', 'rgb(139, 141, 152)')}
              />
            </View>
          ) : hasTextContent ? (
            <View
              style={style(
                'px-4 py-2 rounded-2xl rounded-bl-sm overflow-hidden',
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

          {/* Action buttons for completed assistant messages */}
          {hasTextContent && !isStreaming && (
            <View style={style('flex-row items-center gap-0.5 self-start mt-1')}>
              {/* Copy button */}
              <Pressable
                onPress={() => {
                  const fullText = textParts
                    .filter(p => 'text' in p)
                    .map(p => (p as { text: string }).text)
                    .join('\n');
                  if (onCopyProp) {
                    onCopyProp(fullText);
                  } else {
                    Clipboard.setString(fullText);
                  }
                  if (onHapticProp) {
                    onHapticProp();
                  } else {
                    defaultHaptic?.();
                  }
                  setCopiedId(message.id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                style={style('p-1.5 rounded-md')}
                accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.COPY_MESSAGE')}>
                {copiedId === message.id ? (
                  <TickIcon
                    size={16}
                    color={resolveColor('text-teal-9', '#12A594')}
                    strokeWidth={2}
                  />
                ) : (
                  <Copy size={16} color={resolveColor('text-slate-9', '#80838D')} strokeWidth={2} />
                )}
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        // User: all parts inside bubble
        <View style={style('flex-col items-end flex-1')}>
          <View
            style={style(
              'px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%]',
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
          {/* Spacer for vertical rhythm matching web */}
          <View style={style('h-7')} />
        </View>
      )}
    </View>
  );
};
