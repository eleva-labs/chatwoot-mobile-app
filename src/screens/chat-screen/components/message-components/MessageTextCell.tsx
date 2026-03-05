import React from 'react';
import { Animated, Text, Dimensions } from 'react-native';

import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { Channel, Message, MessageStatus, MessageType } from '@domain/types';
import { messageTimestamp } from '@infrastructure/utils';

import { MarkdownDisplay } from './MarkdownDisplay';
import { MESSAGE_STATUS, INBOX_TYPES, TEXT_MAX_WIDTH } from '@domain/constants';
import { DeliveryStatus } from './DeliveryStatus';
import { EmailMeta } from './EmailMeta';

type MessageTextCellProps = {
  text: string;
  timeStamp: number;
  isIncoming: boolean;
  isOutgoing: boolean;
  isActivity: boolean;
  status: MessageStatus;
  isAvatarRendered?: boolean;
  channel?: Channel;
  messageType: MessageType;
  sourceId?: string;
  isPrivate: boolean;
  errorMessage: string;
  sender: Message['sender'];
  contentAttributes: Message['contentAttributes'];
};

export const MessageTextCell = (props: MessageTextCellProps) => {
  const themedTailwind = useThemedStyles();
  const {
    text,
    timeStamp,
    isIncoming,
    isOutgoing,
    status,
    isAvatarRendered,
    channel,
    messageType,
    sourceId,
    isPrivate,
    errorMessage,
    sender,
    contentAttributes,
  } = props;

  const isMessageFailed = status === MESSAGE_STATUS.FAILED;

  const isEmailMessage = channel === INBOX_TYPES.EMAIL;

  const windowWidth = Dimensions.get('window').width;

  const EMAIL_MESSAGE_WIDTH = windowWidth - 52; // 52 is the sum of the left and right padding (12 + 12) and avatar width (24) and gap between avatar and message (4)

  return (
    <Animated.View
      style={[
        themedTailwind.style(
          'relative pl-3 pr-2.5 py-2 rounded-2xl overflow-hidden',
          isEmailMessage ? `max-w-[${EMAIL_MESSAGE_WIDTH}px]` : `max-w-[${TEXT_MAX_WIDTH}px]`,
          isIncoming ? 'bg-slate-4' : '',
          isOutgoing ? 'bg-solid-blue' : '',
          isMessageFailed ? 'bg-ruby-4' : '',
          isAvatarRendered
            ? isOutgoing
              ? 'rounded-br-none'
              : isIncoming
                ? 'rounded-bl-none'
                : ''
            : '',
        ),
      ]}>
      {contentAttributes && <EmailMeta {...{ contentAttributes, sender }} />}
      <MarkdownDisplay {...{ isIncoming, isOutgoing, isMessageFailed }} messageContent={text} />
      <Animated.View
        style={tailwind.style('h-[21px] pt-2 pb-0.5 flex flex-row items-center justify-end')}>
        <Text
          style={tailwind.style(
            'text-xs font-inter-420-20 tracking-[0.32px] pr-1',
            isIncoming ? 'text-slate-11' : '',
            isOutgoing ? 'text-slate-11' : '',
            isMessageFailed ? 'text-ruby-12' : '',
          )}>
          {messageTimestamp(timeStamp)}
        </Text>
        <DeliveryStatus
          isPrivate={isPrivate}
          status={status}
          messageType={messageType}
          channel={channel}
          sourceId={sourceId}
          errorMessage={errorMessage}
          deliveredColor="text-slate-11"
          sentColor="text-slate-11"
        />
      </Animated.View>
    </Animated.View>
  );
};
