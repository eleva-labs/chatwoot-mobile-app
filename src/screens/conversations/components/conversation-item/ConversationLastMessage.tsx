import React from 'react';
import { StyleProp, Text, ViewStyle } from 'react-native';

import { tailwind } from '@/theme';
import { useThemedStyles } from '@/hooks';
import { NativeView } from '@/components-next/native-components';
import {
  AudioIcon,
  ImageAttachmentIcon,
  DocumentAttachmentIcon,
  PrivateNoteIcon,
  OutgoingIcon,
} from '@/svg-icons';
import { Icon } from '@/components-next';
import { Message } from '@/types';
import { MESSAGE_TYPES } from '@/constants';
import i18n from '@/i18n';
import { getPlainText } from '@/utils/messageFormatterUtils';

type ConversationLastMessageProps = {
  numberOfLines: number;
  lastMessage: Message;
  hasUnread?: boolean;
};

export const ATTACHMENT_ICONS = {
  image: 'image',
  audio: 'headphones-sound-wave',
  video: 'video',
  file: 'document',
  location: 'location',
  fallback: 'link',
};

const getAttachmentIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <ImageAttachmentIcon />;
    case 'audio':
      return <AudioIcon />;
    case 'file':
      return <DocumentAttachmentIcon />;
    default:
      return <DocumentAttachmentIcon />;
  }
};

const MessageType = ({ message, style }: { message: Message; style?: StyleProp<ViewStyle> }) => {
  const { private: isPrivate } = message;
  const isOutgoing = message?.messageType === MESSAGE_TYPES.OUTGOING;

  if (isOutgoing || isPrivate) {
    return (
      <NativeView style={[tailwind.style('flex-row items-center gap-1'), style]}>
        {isPrivate ? (
          <Icon icon={<PrivateNoteIcon />} />
        ) : (
          isOutgoing && <Icon icon={<OutgoingIcon />} />
        )}
      </NativeView>
    );
  }
  return null;
};

const MessageContent = ({
  message,
  numberOfLines,
  hasUnread = false,
}: {
  message: Message;
  numberOfLines: number;
  hasUnread?: boolean;
}) => {
  const themedTailwind = useThemedStyles();
  const { contentAttributes } = message || {};
  const { email: { subject = '' } = {} } = contentAttributes || {};

  const lastMessageContent = getPlainText(subject || message?.content);

  const lastMessageFileType = message?.attachments?.[0]?.fileType;

  const isMessageSticker = message?.contentType === ('sticker' as Message['contentType']);

  const textStyle = hasUnread
    ? 'text-sm flex-1 font-inter-medium-24 leading-6 text-slate-12'
    : 'text-sm flex-1 font-inter-420-20 leading-6 text-slate-11';

  if (message.content && isMessageSticker) {
    return (
      <NativeView style={tailwind.style('flex-row gap-1 items-center')}>
        <Icon icon={<ImageAttachmentIcon />} />
        <Text numberOfLines={1} style={themedTailwind.style(textStyle)}>
          <MessageType message={message} style={tailwind.style('ml-1')} />
          {i18n.t(`CONVERSATION.ATTACHMENTS.image.CONTENT`)}
        </Text>
      </NativeView>
    );
  } else if (lastMessageContent) {
    return (
      <NativeView style={tailwind.style('flex-row gap-1 items-center')}>
        <Text numberOfLines={numberOfLines} style={themedTailwind.style(textStyle)}>
          <MessageType message={message} style={tailwind.style('ml-1')} />
          <Text numberOfLines={numberOfLines} style={themedTailwind.style(textStyle)}>
            {lastMessageContent}
          </Text>
        </Text>
      </NativeView>
    );
  } else if (message.attachments) {
    return (
      <NativeView style={tailwind.style('flex-row gap-1 items-center')}>
        <Icon icon={getAttachmentIcon(lastMessageFileType)} />
        <MessageType message={message} />
        <Text numberOfLines={1} style={themedTailwind.style(textStyle)}>
          {i18n.t(`CONVERSATION.ATTACHMENTS.${lastMessageFileType}.CONTENT`)}
        </Text>
      </NativeView>
    );
  }
  return <Text style={themedTailwind.style(textStyle)}>{i18n.t('CONVERSATION.NO_CONTENT')}</Text>;
};

export const ConversationLastMessage = (props: ConversationLastMessageProps) => {
  const { numberOfLines, lastMessage, hasUnread = false } = props;
  return (
    <NativeView style={tailwind.style('flex-1 flex-row gap-1 items-start')}>
      <MessageContent message={lastMessage} numberOfLines={numberOfLines} hasUnread={hasUnread} />
    </NativeView>
  );
};
