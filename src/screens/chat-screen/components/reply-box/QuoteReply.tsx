import React, { useCallback } from 'react';
import { Pressable, Text } from 'react-native';
import Markdown, { MarkdownIt } from '@ronradtke/react-native-markdown-display';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { CloseIcon } from '@/svg-icons/common/CloseIcon';

import { useRefsContext } from '@infrastructure/context';
import { FileIcon, VoiceNote } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { isMarkdown } from '@infrastructure/utils';
import { Icon } from '@infrastructure/ui/common';
import { useMarkdownTheme } from '@infrastructure/hooks';

import { useAppDispatch, useAppSelector } from '@application/store/hooks';

import {
  selectQuoteMessage,
  setQuoteMessage,
} from '@application/store/conversation/sendMessageSlice';

import { VideoPlayer } from '../message-components';
import { Message } from '@domain/types';

const AudioIcon = () => {
  return (
    <Animated.View style={tailwind.style('flex-1 justify-center items-center')}>
      <Icon
        icon={<VoiceNote stroke={tailwind.color('text-iris-11')} strokeOpacity={1} />}
        size={24}
      />
    </Animated.View>
  );
};
const File = () => {
  return (
    <Animated.View style={tailwind.style('flex-1  justify-center items-center')}>
      <Icon icon={<FileIcon fill={tailwind.color('text-iris-11')} />} size={24} />
    </Animated.View>
  );
};

export const QuoteReply = () => {
  const quoteMessage = useAppSelector(selectQuoteMessage);
  const dispatch = useAppDispatch();

  const { messageListRef } = useRefsContext();

  const styles = useMarkdownTheme();

  const handleOnPressClose = () => {
    dispatch(setQuoteMessage(null));
  };

  const handleScrollToMessage = useCallback(() => {
    const messageIndex = messageListRef.current?.props.data?.findIndex(
      (item: Message | { date: string }) => 'id' in item && item.id === quoteMessage?.id,
    );
    const shouldScrollToMessage = messageIndex !== -1 && messageIndex !== undefined;

    if (shouldScrollToMessage) {
      messageListRef.current?.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      onPress={handleScrollToMessage}
      style={tailwind.style('flex flex-row items-center px-2.5 pb-[14px] bg-solid-1 -z-10')}>
      {quoteMessage?.attachments?.length && quoteMessage?.attachments?.length > 0 ? (
        <Animated.View style={tailwind.style('h-9.5 w-9.5 mr-3 rounded-lg overflow-hidden')}>
          {quoteMessage?.attachments?.length > 0 &&
          quoteMessage?.attachments[0].fileType === 'image' ? (
            <Image
              style={tailwind.style('h-full w-full')}
              contentFit="cover"
              source={quoteMessage?.attachments[0].thumbUrl}
            />
          ) : null}
          {quoteMessage?.attachments?.length > 0 &&
          quoteMessage?.attachments[0].fileType === 'video' ? (
            <VideoPlayer playerEnabled={false} videoSrc={quoteMessage?.attachments[0].dataUrl} />
          ) : null}
          {quoteMessage?.attachments?.length > 0 &&
          quoteMessage?.attachments[0].fileType === 'audio' ? (
            <AudioIcon />
          ) : null}
          {quoteMessage?.attachments[0].fileType === 'file' ? <File /> : null}
        </Animated.View>
      ) : null}
      <Animated.View style={tailwind.style('flex-1')}>
        <Animated.View>
          <Animated.Text
            style={tailwind.style(
              'text-cxs tracking-[0.32px] leading-[15px] font-inter-420-20 text-slate-11',
            )}>
            Replying to {quoteMessage?.sender?.name}
          </Animated.Text>
        </Animated.View>
        <Animated.View style={tailwind.style('pt-0.5')}>
          {quoteMessage?.content ? (
            isMarkdown(quoteMessage.content) ? (
              <Markdown
                mergeStyle
                markdownit={MarkdownIt({
                  breaks: true,
                  linkify: true,
                  typographer: true,
                })}
                //   onLinkPress={handleURL}
                style={styles}>
                {quoteMessage?.content.split('\n').length > 0
                  ? `${quoteMessage?.content.split('\n')[0]}`
                  : ''}
              </Markdown>
            ) : (
              <Text
                numberOfLines={1}
                style={tailwind.style('text-md font-inter-normal-20 tracking-[0.32px] capitalize')}>
                {quoteMessage?.content}
              </Text>
            )
          ) : (
            <Text
              style={tailwind.style('text-md font-inter-normal-20 tracking-[0.32px] capitalize')}>
              {quoteMessage?.attachments?.[0]?.fileType}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
      <Pressable
        style={tailwind.style('h-10 w-10 items-center justify-center -mr-[1px]')}
        onPress={handleOnPressClose}>
        <CloseIcon size={24} color={tailwind.color('text-slate-12')} />
      </Pressable>
    </Pressable>
  );
};
