import React from 'react';

import Animated, {
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useAppKeyboardAnimation } from '@infrastructure/utils';
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

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<Message | { date: string }>);

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

export const MessagesList = ({
  messages,
  isFlashListReady,
  setFlashListReady,
  onStartReached,
  isEmailInbox,
  currentUserId,
}: MessagesListPresentationProps) => {
  const { progress, height } = useAppKeyboardAnimation();
  const { messageListRef } = useRefsContext();
  const typedMessageListRef = messageListRef as React.RefObject<FlashListRef<
    Message | { date: string }
  > | null>;

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

  const animatedFlashlistStyle = useAnimatedStyle(() => {
    return {
      marginBottom: withSpring(interpolate(progress.value, [0, 1], [0, height.value]), {
        stiffness: 240,
        damping: 38,
      }),
    };
  });

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(38).stiffness(240)}
      style={[tailwind.style('flex-1 min-h-10'), animatedFlashlistStyle]}>
      <AnimatedFlashlist
        layout={LinearTransition.springify().damping(38).stiffness(240)}
        onScroll={() => {
          if (!isFlashListReady) {
            setFlashListReady(true);
          }
        }}
        ref={typedMessageListRef}
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
          autoscrollToBottomThreshold: 0.1,
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
    </Animated.View>
  );
};
