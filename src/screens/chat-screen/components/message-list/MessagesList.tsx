import React from 'react';

import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FlashList, type FlashListRef } from '@shopify/flash-list';

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
  onEndReached: () => void;
  isEmailInbox: boolean;
  currentUserId: number;
};

export const MessagesList = ({
  messages,
  isFlashListReady,
  setFlashListReady,
  onEndReached,
  isEmailInbox,
  currentUserId,
}: MessagesListPresentationProps) => {
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

  return (
    <View style={tailwind.style('flex-1 min-h-10')}>
      <FlashList
        ref={typedMessageListRef}
        inverted
        data={messages}
        renderItem={handleRender}
        estimatedItemSize={80}
        onScroll={() => {
          if (!isFlashListReady) {
            setFlashListReady(true);
          }
        }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tailwind.style('px-3')}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item: { date: string } | Message) => {
          if ('date' in item) {
            return item.date.toString();
          }
          return item.id.toString();
        }}
      />
    </View>
  );
};
