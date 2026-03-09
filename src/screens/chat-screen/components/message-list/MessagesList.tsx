import React, { useCallback, useEffect, useRef, useState } from 'react';

import Animated, { LinearTransition } from 'react-native-reanimated';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { ActivityIndicator, View } from 'react-native';

import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { Message } from '@domain/types';
import { MessageComponent } from '../message-item/Message';
// import { MessageItemContainer } from '../message-item/MessageItemContainer';
import { useRefsContext } from '@infrastructure/context';

export type FlashListRenderProps = {
  item: { date: string } | Message;
  index: number;
};

type DateSectionProps = { item: { date: string } };

const DateSection = ({ item }: DateSectionProps) => {
  const themedTailwind = useThemedStyles();
  return (
    <Animated.View style={themedTailwind.style('flex flex-row justify-center items-center py-4')}>
      <Animated.View style={themedTailwind.style('rounded-lg py-1 px-[7px] bg-slate-3')}>
        <Animated.Text
          style={themedTailwind.style(
            'text-cxs font-inter-420-20 tracking-[0.32px] text-slate-11 leading-[15px]',
          )}>
          {item.date}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

type MessagesListPresentationProps = {
  messages: (Message | { date: string })[];
  isFlashListReady: boolean;
  setFlashListReady: (ready: boolean) => void;
  onStartReached: () => void;
  isEmailInbox: boolean;
  currentUserId: number;
};

// Timeout (ms) to force reveal the list if onScroll never fires
// (e.g., too few messages to require scrolling)
const LAYOUT_READY_FALLBACK_MS = 500;

export const MessagesList = ({
  messages,
  isFlashListReady,
  setFlashListReady,
  onStartReached,
  isEmailInbox,
  currentUserId,
}: MessagesListPresentationProps) => {
  const themedTailwind = useThemedStyles();
  const { messageListRef } = useRefsContext();
  const typedMessageListRef = messageListRef as React.RefObject<FlashListRef<
    Message | { date: string }
  > | null>;

  // Track whether the FlashList has completed its initial layout + scroll-to-bottom
  // so we can hide the progressive top-down fill that startRenderingFromBottom causes.
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const layoutReadyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reveal the list — called when we're confident the list is positioned at the bottom.
  const revealList = useCallback(() => {
    if (layoutReadyTimeout.current) {
      clearTimeout(layoutReadyTimeout.current);
      layoutReadyTimeout.current = null;
    }
    setIsLayoutReady(true);
  }, []);

  // Fallback timer: if no scroll event fires within LAYOUT_READY_FALLBACK_MS
  // (e.g., very few messages that don't fill the viewport), reveal anyway.
  useEffect(() => {
    if (!isLayoutReady) {
      layoutReadyTimeout.current = setTimeout(revealList, LAYOUT_READY_FALLBACK_MS);
    }
    return () => {
      if (layoutReadyTimeout.current) {
        clearTimeout(layoutReadyTimeout.current);
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRender = ({ item, index }: { item: Message | { date: string }; index: number }) => {
    if ('date' in item) {
      return <DateSection item={item} />;
    }

    return (
      <MessageComponent
        item={item}
        index={index}
        isEmailInbox={isEmailInbox}
        currentUserId={currentUserId}
      />
    );
    // TODO: Deprecate this after the new message item is ready
    // return <MessageItemContainer item={item} index={index} />;
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(38).stiffness(240)}
      style={tailwind.style('flex-1 min-h-10')}>
      {/* Loading indicator shown while FlashList is hidden during initial layout */}
      {!isLayoutReady && (
        <View
          style={themedTailwind.style(
            'absolute inset-0 z-10 items-center justify-center bg-solid-1',
          )}>
          <ActivityIndicator />
        </View>
      )}
      {/* Hide the FlashList with opacity:0 during initial layout to prevent
          the visible top-down progressive fill. The list stays mounted so it
          can measure and lay out items + scroll to bottom. */}
      <View style={{ flex: 1, opacity: isLayoutReady ? 1 : 0 }}>
        <FlashList
          ref={typedMessageListRef}
          overrideProps={{ initialDrawBatchSize: 10 }}
          drawDistance={500}
          getItemType={item => {
            if ('date' in item) return 'date';
            return 'message';
          }}
          onScroll={() => {
            if (!isFlashListReady) {
              setFlashListReady(true);
            }
            // The first onScroll event means startRenderingFromBottom has
            // completed its initial scroll positioning — safe to reveal.
            if (!isLayoutReady) {
              revealList();
            }
          }}
          onLoad={() => {
            // onLoad fires when FlashList completes its initial render.
            // If there aren't enough messages to scroll, onScroll won't fire,
            // so this serves as an additional trigger to reveal the list.
            if (!isLayoutReady) {
              revealList();
            }
          }}
          maintainVisibleContentPosition={{
            startRenderingFromBottom: true,
            autoscrollToBottomThreshold: 0.5,
            animateAutoScrollToBottom: true,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={handleRender}
          onStartReached={onStartReached}
          onStartReachedThreshold={0.2}
          data={messages}
          contentContainerStyle={tailwind.style('px-3')}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item: { date: string } | Message) => {
            if ('date' in item) {
              return item.date.toString();
            }
            return item.id.toString();
          }}
        />
      </View>
    </Animated.View>
  );
};
