/**
 * AIChatMessagesList Component
 *
 * Renders the scrollable list of AI chat messages using FlashList.
 * Each message renders its own parts (text, reasoning, tools) via AIMessageBubble,
 * matching the Vue AiChatPanel pattern where part rendering is per-message.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Platform, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';
import type { UIMessage } from 'ai';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { AIMessageBubble } from './AIMessageBubble';
import { AIChatError } from './AIChatError';
import { AIChatEmptyState } from './AIChatEmptyState';
import type { FlashListRef } from '@/presentation/hooks/ai-assistant/useAIChatScroll';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { useResolveColor } from '@/presentation/hooks/ai-assistant/useAITheme';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashListAny: any = AnimatedFlashList;

// Memoize message bubble component to prevent unnecessary re-renders
const MemoizedAIMessageBubble = React.memo(AIMessageBubble);

/** Separator between message bubbles for consistent vertical spacing */
const ItemSeparator = React.memo(() => <View style={separatorStyles.separator} />);
ItemSeparator.displayName = 'ItemSeparator';

const separatorStyles = StyleSheet.create({
  separator: {
    height: 8,
  },
});

export interface AIChatMessagesListProps {
  listData: UIMessage[];
  isLoading: boolean;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
  isLoadingMessages: boolean;
  activeSessionId: string | null;
  error: Error | null;
  listRef: React.RefObject<FlashListRef | null>;
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
    const { t } = useAIi18n();
    const resolveColor = useResolveColor();

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
                {t('AI_ASSISTANT.CHAT.MESSAGES.ERROR_RENDERING', { id: item.id || 'unknown' })}
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
        t,
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

    const estimatedItemSize = useMemo(() => 300, []);

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
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.LOADING_MESSAGES')}>
            <Text style={style(tokens.text.muted)}>
              {t('AI_ASSISTANT.CHAT.MESSAGES.LOADING')}
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
            ItemSeparatorComponent={ItemSeparator}
            drawDistance={500}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={style('py-4')}
            keyboardShouldPersistTaps="handled"
            extraData={extraData}
            removeClippedSubviews={Platform.OS === 'android'}
          />
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
            <ChevronDown size={16} color={resolveColor('text-slate-11', '#60646C')} strokeWidth={2} />
          </Pressable>
        )}
        {!isAtTop && (
          <Pressable
            onPress={onScrollToTop}
            style={style(
              'absolute top-2 right-2 w-9 h-9 rounded-full bg-slate-3 items-center justify-center border border-slate-6 shadow-md',
            )}>
            <ChevronUp size={16} color={resolveColor('text-slate-11', '#60646C')} strokeWidth={2} />
          </Pressable>
        )}
      </View>
    );
  },
);

AIChatMessagesList.displayName = 'AIChatMessagesList';
