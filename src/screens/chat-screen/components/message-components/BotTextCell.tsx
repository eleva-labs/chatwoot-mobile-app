import React from 'react';
import { Animated, Text } from 'react-native';

import { tailwind } from '@infrastructure/theme';
import { Channel, MessageStatus, MessageType } from '@domain/types';
import { messageTimestamp } from '@infrastructure/utils';

import { MarkdownDisplay } from './MarkdownDisplay';
import { TEXT_MAX_WIDTH } from '@domain/constants';
import { DeliveryStatus } from './DeliveryStatus';

type BotTextCellProps = {
  text: string;
  timeStamp: number;
  status: MessageStatus;
  isAvatarRendered?: boolean;
  channel?: Channel;
  messageType: MessageType;
  sourceId?: string;
  isPrivate: boolean;
  errorMessage?: string;
};
export const BotTextCell = (props: BotTextCellProps) => {
  const {
    text,
    timeStamp,
    status,
    isAvatarRendered,
    channel,
    messageType,
    sourceId,
    isPrivate,
    errorMessage,
  } = props;

  return (
    <Animated.View
      style={[
        tailwind.style(
          'relative max-w-[300px] pl-3 pr-2.5 py-2 rounded-2xl overflow-hidden bg-solid-iris',
          `max-w-[${TEXT_MAX_WIDTH}px]`,

          isAvatarRendered ? 'rounded-br-none' : '',
        ),
      ]}>
      <MarkdownDisplay isBotText messageContent={text} />

      <Animated.View
        style={tailwind.style('h-[21px] pt-2 pb-0.5 flex flex-row items-center justify-end')}>
        <Text
          style={tailwind.style('text-xs font-inter-420-20 tracking-[0.32px] pr-1 text-slate-11')}>
          {messageTimestamp(timeStamp)}
        </Text>
        <DeliveryStatus
          isPrivate={isPrivate}
          status={status}
          messageType={messageType}
          channel={channel}
          sourceId={sourceId || ''}
          errorMessage={errorMessage || ''}
          deliveredColor="text-slate-11"
          sentColor="text-slate-11"
        />
      </Animated.View>
    </Animated.View>
  );
};
