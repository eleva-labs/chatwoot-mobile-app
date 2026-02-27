/**
 * AIChatMessagesList Component
 *
 * Renders the scrollable list of AI chat messages using FlashList.
 * Each message renders its own parts (text, reasoning, tools) via AIMessageBubble,
 * matching the Vue AiChatPanel pattern where part rendering is per-message.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import type { UIMessage } from 'ai';
import { AIMessageBubble } from './AIMessageBubble';
import { AIChatError } from './AIChatError';
import { AIChatEmptyState } from './AIChatEmptyState';
import { Avatar } from '@/components-next/common/avatar/Avatar';
import type { FlashListRef } from '@/presentation/hooks/ai-assistant/useAIChatScroll';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { tailwind } from '@/theme/tailwind';
import { isTextPart, type MessagePart } from '@/types/ai-chat/parts';
import i18n from '@/i18n';

/** Animated typing dot for the thinking indicator */
const TypingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: tailwind.color('bg-slate-9') ?? '#8B8D98',
        },
        animatedStyle,
      ]}
    />
  );
};

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashListAny: any = AnimatedFlashList;

// Memoize message bubble component to prevent unnecessary re-renders
const MemoizedAIMessageBubble = React.memo(AIMessageBubble);

export interface AIChatMessagesListProps {
  listData: UIMessage[];
  isLoading: boolean;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
  isLoadingMessages: boolean;
  activeSessionId: string | null;
  error: Error | null;
  listRef: React.RefObject<FlashListRef>;
  onScroll: (event: { nativeEvent: unknown }) => void;
  botAvatarName?: string;
  botAvatarSrc?: string;
  userAvatarName?: string;
  isAtBottom?: boolean;
  isAtTop?: boolean;
  onScrollToBottom?: () => void;
  onScrollToTop?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  onFreshStart?: () => void;
  onSendPrompt?: (text: string) => void;
}

export const AIChatMessagesList: React.FC<AIChatMessagesListProps> = React.memo(
  ({
    listData,
    isLoading,
    status,
    isLoadingMessages,
    activeSessionId,
    error,
    listRef,
    onScroll,
    botAvatarName,
    botAvatarSrc,
    userAvatarName,
    isAtBottom,
    isAtTop,
    onScrollToBottom,
    onScrollToTop,
    onRetry,
    onDismiss,
    onFreshStart,
    onSendPrompt,
  }) => {
    const { style, tokens } = useAIStyles();

    // Compute whether the last assistant message has text content (for panel-level loader)
    const lastAssistantHasText = useMemo(() => {
      if (listData.length === 0) return false;
      const lastMsg = listData[listData.length - 1];
      if (lastMsg.role !== 'assistant') return false;
      return (lastMsg.parts ?? []).some(
        p => isTextPart(p as MessagePart) && 'text' in p && (p.text as string)?.trim(),
      );
    }, [listData]);

    // Memoize render item
    const renderItem = useCallback(
      ({ item, index }: { item: UIMessage; index: number }) => {
        try {
          // Determine if this is the last assistant message and currently streaming
          const isStreaming =
            isLoading && item.role === 'assistant' && index === listData.length - 1;
          return (
            <MemoizedAIMessageBubble
              message={item}
              isStreaming={isStreaming}
              avatarName={item.role === 'user' ? userAvatarName : botAvatarName}
              avatarSrc={item.role === 'user' ? undefined : botAvatarSrc}
            />
          );
        } catch (renderError) {
          console.error('[AIChatMessagesList] Error rendering message item:', renderError, item);
          return (
            <View style={style('p-4 mb-3')}>
              <Text style={style('text-sm', tokens.tool.errorText)}>
                {i18n.t('AI_ASSISTANT.CHAT.MESSAGES.ERROR_RENDERING', { id: item.id || 'unknown' })}
              </Text>
            </View>
          );
        }
      },
      [
        isLoading,
        listData.length,
        style,
        tokens.tool.errorText,
        userAvatarName,
        botAvatarName,
        botAvatarSrc,
      ],
    );

    // Memoize key extractor - must be stable for FlashList
    const keyExtractor = useCallback((item: UIMessage, index: number) => {
      if (item.id) {
        return item.id;
      }
      const createdAtMs = (item as unknown as { createdAt?: Date }).createdAt?.getTime?.() || 0;
      return `msg-${item.role}-${index}-${createdAtMs}`;
    }, []);

    const estimatedItemSize = useMemo(() => 100, []);

    // Memoize extraData for FlashList
    const extraData = useMemo(() => {
      return `${listData.length}-${isLoading}`;
    }, [listData.length, isLoading]);

    return (
      <View style={style('flex-1 min-h-0')}>
        {isLoadingMessages && activeSessionId ? (
          <View
            style={style('flex-1 items-center justify-center p-4')}
            accessible
            accessibilityRole="text"
            accessibilityLabel={i18n.t('AI_ASSISTANT.CHAT.ACCESSIBILITY.LOADING_MESSAGES')}>
            <Text style={style(tokens.text.muted)}>
              {i18n.t('AI_ASSISTANT.CHAT.MESSAGES.LOADING')}
            </Text>
          </View>
        ) : listData.length === 0 && status === 'ready' ? (
          <AIChatEmptyState hasActiveSession={!!activeSessionId} onSendPrompt={onSendPrompt} />
        ) : (
          <AnimatedFlashListAny
            ref={listRef}
            data={listData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={estimatedItemSize}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={style('p-4')}
            keyboardShouldPersistTaps="handled"
            extraData={extraData}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        )}

        {/* Typing indicator bubble for SUBMITTED state */}
        {(status === 'submitted' || (status === 'streaming' && !lastAssistantHasText)) && (
          <View style={style('flex-row items-end gap-2 px-4 py-2')}>
            <View style={[style('mb-1'), { flexShrink: 0 }]}>
              <Avatar
                name={botAvatarName || 'AI'}
                src={botAvatarSrc ? { uri: botAvatarSrc } : undefined}
                size="lg"
              />
            </View>
            <View style={style('px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-3')}>
              <View style={style('flex-row items-center gap-1')}>
                <TypingDot delay={0} />
                <TypingDot delay={150} />
                <TypingDot delay={300} />
              </View>
            </View>
          </View>
        )}

        {/* Error message */}
        {error && (
          <AIChatError
            error={error}
            onRetry={onRetry}
            onDismiss={onDismiss}
            onFreshStart={onFreshStart}
          />
        )}

        {/* Floating scroll buttons */}
        {!isAtBottom && (
          <Pressable
            onPress={onScrollToBottom}
            style={style(
              'absolute bottom-2 right-2 w-9 h-9 rounded-full bg-slate-3 items-center justify-center border border-slate-6 shadow-md',
            )}>
            <Text style={style('text-sm text-slate-11')}>↓</Text>
          </Pressable>
        )}
        {!isAtTop && listData.length > 5 && (
          <Pressable
            onPress={onScrollToTop}
            style={style(
              'absolute top-2 right-2 w-9 h-9 rounded-full bg-slate-3 items-center justify-center border border-slate-6 shadow-md',
            )}>
            <Text style={style('text-sm text-slate-11')}>↑</Text>
          </Pressable>
        )}
      </View>
    );
  },
);

AIChatMessagesList.displayName = 'AIChatMessagesList';
