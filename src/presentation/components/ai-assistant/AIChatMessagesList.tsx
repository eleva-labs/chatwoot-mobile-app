/**
 * AIChatMessagesList Component
 *
 * Renders the scrollable list of AI chat messages using FlashList.
 * Each message renders its own parts (text, reasoning, tools) via AIMessageBubble,
 * matching the Vue AiChatPanel pattern where part rendering is per-message.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { LinearTransition } from 'react-native-reanimated';
import type { UIMessage } from 'ai';
import { AIMessageBubble } from './AIMessageBubble';
import type { FlashListRef } from '@/presentation/hooks/ai-assistant/useAIChatScroll';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashListAny: any = AnimatedFlashList;

// Memoize message bubble component to prevent unnecessary re-renders
const MemoizedAIMessageBubble = React.memo(AIMessageBubble);

export interface AIChatMessagesListProps {
  listData: UIMessage[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  activeSessionId: string | null;
  error: Error | null;
  listRef: React.RefObject<FlashListRef>;
  onScroll: (event: { nativeEvent: unknown }) => void;
}

export const AIChatMessagesList: React.FC<AIChatMessagesListProps> = React.memo(
  ({ listData, isLoading, isLoadingMessages, activeSessionId, error, listRef, onScroll }) => {
    const { style, tokens } = useAIStyles();

    // Memoize render item
    const renderItem = useCallback(
      ({ item }: { item: UIMessage }) => {
        try {
          // Determine if this is the last assistant message and currently streaming
          const isStreaming = isLoading && item.role === 'assistant';
          return <MemoizedAIMessageBubble message={item} isStreaming={isStreaming} />;
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
      [isLoading, style, tokens.tool.errorText],
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
        ) : listData.length === 0 ? (
          <View
            style={style('flex-1 items-center justify-center p-4')}
            accessible
            accessibilityRole="text"
            accessibilityLabel="No messages yet">
            <Text style={style(tokens.text.muted)}>
              {activeSessionId
                ? 'No messages in this conversation'
                : 'Start a conversation with the AI assistant'}
            </Text>
          </View>
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
            layout={
              !isLoading ? LinearTransition.springify().damping(20).stiffness(180) : undefined
            }
            extraData={extraData}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        )}

        {/* Error message */}
        {error && (
          <View
            style={style('mx-4 mb-2 p-3 rounded-lg', tokens.tool.errorBackground)}
            accessible
            accessibilityRole="alert"
            accessibilityLabel="Error message">
            <Text style={style(tokens.tool.errorText)}>{error.message || String(error)}</Text>
          </View>
        )}
      </View>
    );
  },
);

AIChatMessagesList.displayName = 'AIChatMessagesList';
