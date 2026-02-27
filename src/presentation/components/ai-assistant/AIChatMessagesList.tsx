/**
 * AIChatMessagesList Component
 *
 * Renders the scrollable list of AI chat messages using FlashList.
 * Each message renders its own parts (text, reasoning, tools) via AIMessageBubble,
 * matching the Vue AiChatPanel pattern where part rendering is per-message.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Platform, ActivityIndicator, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';
import type { UIMessage } from 'ai';
import { AIMessageBubble } from './AIMessageBubble';
import { AIChatError } from './AIChatError';
import { AIChatEmptyState } from './AIChatEmptyState';
import type { FlashListRef } from '@/presentation/hooks/ai-assistant/useAIChatScroll';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { tailwind } from '@/theme/tailwind';
import { isTextPart, type MessagePart } from '@/types/ai-chat/parts';

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
                Error rendering message: {item.id || 'unknown'}
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
            accessibilityLabel="Loading messages">
            <Text style={style(tokens.text.muted)}>Loading conversation...</Text>
          </View>
        ) : listData.length === 0 && status === 'ready' ? (
          <AIChatEmptyState hasActiveSession={!!activeSessionId} />
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

        {/* Panel-level loader for SUBMITTED state */}
        {(status === 'submitted' || (status === 'streaming' && !lastAssistantHasText)) && (
          <View style={style('flex-row items-center gap-2 px-4 py-3')}>
            <ActivityIndicator
              size="small"
              color={tailwind.color('text-slate-9') ?? 'rgb(139, 141, 152)'}
            />
            <Text style={style('text-sm', tokens.text.muted)}>
              {status === 'submitted' ? 'Thinking...' : 'Generating...'}
            </Text>
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
              'absolute bottom-2 right-2 w-8 h-8 rounded-full bg-slate-3 items-center justify-center border border-slate-6',
            )}>
            <Text style={style('text-sm text-slate-11')}>↓</Text>
          </Pressable>
        )}
        {!isAtTop && listData.length > 5 && (
          <Pressable
            onPress={onScrollToTop}
            style={style(
              'absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-3 items-center justify-center border border-slate-6',
            )}>
            <Text style={style('text-sm text-slate-11')}>↑</Text>
          </Pressable>
        )}
      </View>
    );
  },
);

AIChatMessagesList.displayName = 'AIChatMessagesList';
