import React, { useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { LinearTransition } from 'react-native-reanimated';
import type { UIMessage, UIMessagePart, UIDataTypes, UITools } from 'ai';
import { AIMessageBubble } from './AIMessageBubble';
import { AIThoughtsView } from './AIThoughtsView';
import { AIToolIndicator } from './AIToolIndicator';
import type { FlashListRef } from '@/presentation/hooks/ai-assistant/useAIChatScroll';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashListAny: any = AnimatedFlashList;

// Memoize message bubble component to prevent unnecessary re-renders
const MemoizedAIMessageBubble = React.memo(AIMessageBubble);

// Memoize tool indicator
const MemoizedAIToolIndicator = React.memo(AIToolIndicator);

export interface AIChatMessagesListProps {
  listData: UIMessage[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  activeSessionId: string | null;
  error: Error | null;
  toolCalls: UIMessagePart<UIDataTypes, UITools>[];
  listRef: React.RefObject<FlashListRef>;
  onScroll: (event: { nativeEvent: unknown }) => void;
  thoughtsText: string;
}

export const AIChatMessagesList: React.FC<AIChatMessagesListProps> = React.memo(
  ({
    listData,
    isLoading,
    isLoadingMessages,
    activeSessionId,
    error,
    toolCalls,
    listRef,
    onScroll,
    thoughtsText,
  }) => {
    const { style, tokens } = useAIStyles();

    // Memoize render item to prevent re-renders
    const renderItem = useCallback(
      ({ item }: { item: UIMessage }) => {
        try {
          // Check if this is the THOUGHTS anchor
          // @ts-expect-error - Custom flag for THOUGHTS anchor
          if (item.isThoughtsAnchor) {
            console.log('[AIChatMessagesList] Rendering THOUGHTS anchor', {
              thoughtsTextLength: thoughtsText.length,
              preview: thoughtsText.substring(0, 80),
            });
            return (
              <AIThoughtsView
                message={{
                  ...item,
                  parts: [{ type: 'text', text: thoughtsText }],
                }}
              />
            );
          }

          // Determine if this message is currently streaming
          const isStreaming = isLoading && item.role === 'assistant';

          // For regular messages, just render the bubble
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
      [isLoading, style, tokens.tool.errorText, thoughtsText],
    );

    // Memoize key extractor - must be stable for FlashList
    const keyExtractor = useCallback((item: UIMessage, index: number) => {
      // Use a stable key based on message ID, role, and index
      // This ensures FlashList can properly track items
      if (item.id) {
        return item.id;
      }
      // Fallback: use role and index for stable key
      // Note: This should rarely happen as useChat generates IDs
      const createdAtMs = (item as unknown as { createdAt?: Date }).createdAt?.getTime?.() || 0;
      return `msg-${item.role}-${index}-${createdAtMs}`;
    }, []);

    // Memoize estimated item size for FlashList performance
    const estimatedItemSize = useMemo(() => 80, []);

    // Memoize extraData for FlashList to prevent excessive re-renders
    const extraData = useMemo(() => {
      // Track length, isLoading, and thoughtsText.length
      // Message IDs are stable during streaming (same messages, different content)
      // FlashList will detect content changes via the message objects themselves
      // thoughtsText.length ensures THOUGHTS anchor re-renders when reasoning content updates
      return `${listData.length}-${isLoading}-${thoughtsText.length}`;
    }, [listData.length, isLoading, thoughtsText.length]);

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
            // Force FlashList to detect changes by using extraData
            // Use a stable hash that only changes when message IDs actually change
            // This prevents excessive re-renders during streaming
            extraData={extraData}
            // Performance optimizations
            removeClippedSubviews={Platform.OS === 'android'}
          />
        )}

        {/* Tool indicators */}
        {toolCalls.length > 0 && (
          <View style={style('px-4 pb-2')}>
            <MemoizedAIToolIndicator toolCalls={toolCalls} />
          </View>
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
