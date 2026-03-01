import React, { useMemo } from 'react';
import { Text, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FileErrorIcon, LockIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { Channel, Message } from '@domain/types';
import { getAvatarSource, isOlderThan24Hours, messageTimestamp } from '@infrastructure/utils';
import { Avatar, Icon } from '@infrastructure/ui';
import { MarkdownDisplay } from './MarkdownDisplay';
import { MenuOption, MessageMenu } from '../message-menu';
import { ReplyMessageCell } from './ReplyMessageCell';
import { INBOX_TYPES, MESSAGE_TYPES, TEXT_MAX_WIDTH } from '@domain/constants';

import { AudioPlayer } from './AudioCell';
import { FilePreview } from './FileCell';
import { ImageBubbleContainer as ImageContainer } from './ImageBubble';
import { VideoPlayer } from './VideoCell';
import { DeliveryStatus } from './DeliveryStatus';
import { useAppSelector } from '@/hooks';
import { useChatWindowContext } from '@infrastructure/context';
import { getMessagesByConversationId } from '@application/store/conversation/conversationSelectors';
import { ATTACHMENT_TYPES } from '@domain/constants';
import i18n from '@infrastructure/i18n';

type ComposedCellProps = {
  messageData: Message;
  channel?: Channel;
  menuOptions: MenuOption[];
};

export const ComposedCell = (props: ComposedCellProps) => {
  const {
    messageType,
    content,
    shouldRenderAvatar,
    sender,
    private: isPrivate,
    status,
    sourceId,
    createdAt,
    contentAttributes,
  } = props.messageData as Message;
  const { channel, menuOptions } = props;
  const { conversationId } = useChatWindowContext();

  const messages = useAppSelector(state => getMessagesByConversationId(state, { conversationId }));

  const isIncoming = messageType === MESSAGE_TYPES.INCOMING;
  const isOutgoing = messageType === MESSAGE_TYPES.OUTGOING;
  const isActivity = messageType === MESSAGE_TYPES.ACTIVITY;
  const isTemplate = messageType === MESSAGE_TYPES.TEMPLATE;

  const isReplyMessage = useMemo(
    () => contentAttributes?.inReplyTo !== undefined,
    [contentAttributes?.inReplyTo],
  );

  const replyMessage = useMemo(
    () =>
      contentAttributes && contentAttributes?.inReplyTo
        ? messages.find(message => message.id === contentAttributes?.inReplyTo) || null
        : null,
    [messages, contentAttributes],
  );
  const errorMessage = contentAttributes?.externalError || '';
  const { imageType } = contentAttributes || {};
  const isAnInstagramStory = imageType === ATTACHMENT_TYPES.STORY_MENTION;
  const isInstagramStoryExpired = isOlderThan24Hours(createdAt);

  const isEmailMessage = channel === INBOX_TYPES.EMAIL;

  const windowWidth = Dimensions.get('window').width;

  const EMAIL_MESSAGE_WIDTH = windowWidth - 52; // 52 is the sum of the left and right padding (12 + 12) and avatar width (24) and gap between avatar and message (4)

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={tailwind.style(
        'my-[1px]',
        isIncoming && 'items-start',
        isOutgoing && 'items-end',
        isTemplate && 'items-end',
        isEmailMessage && 'items-start',
        isActivity ? 'items-center' : '',
        !shouldRenderAvatar && isIncoming ? 'ml-7' : '',
        !shouldRenderAvatar && isOutgoing ? 'pr-7' : '',
        !shouldRenderAvatar && isTemplate ? 'pr-7' : '',
        shouldRenderAvatar ? 'mb-2' : '',
        isPrivate ? 'my-6' : '',
      )}>
      <Animated.View style={tailwind.style('flex flex-row')}>
        {sender?.name && isIncoming && shouldRenderAvatar ? (
          <Animated.View style={tailwind.style('flex items-end justify-end mr-1')}>
            <Avatar size={'md'} src={getAvatarSource(sender)} name={sender?.name || ''} />
          </Animated.View>
        ) : null}

        <MessageMenu menuOptions={menuOptions}>
          <Animated.View
            style={[
              tailwind.style(
                'relative pl-3 pr-2.5 py-2 h-full rounded-2xl overflow-hidden',
                isEmailMessage ? `max-w-[${EMAIL_MESSAGE_WIDTH}px]` : `max-w-[${TEXT_MAX_WIDTH}px]`,
                isIncoming ? 'bg-slate-4' : '',
                isOutgoing ? 'bg-solid-blue' : '',
                isPrivate ? ' bg-solid-amber' : '',
                shouldRenderAvatar
                  ? isOutgoing
                    ? 'rounded-br-none'
                    : isIncoming
                      ? 'rounded-bl-none'
                      : ''
                  : '',
              ),
            ]}>
            <Animated.View>
              <Animated.View>
                {isReplyMessage && replyMessage ? (
                  <ReplyMessageCell {...{ replyMessage, isIncoming, isOutgoing }} />
                ) : null}
                {content && (
                  <MarkdownDisplay {...{ isIncoming, isOutgoing }} messageContent={content} />
                )}
                {props.messageData.attachments &&
                  props.messageData.attachments.map((attachment, index) => {
                    if (attachment.fileType === 'audio') {
                      return (
                        <Animated.View
                          key={attachment.fileType + index}
                          style={tailwind.style('flex-1 py-3 px-2 rounded-xl my-2')}>
                          <AudioPlayer
                            audioSrc={attachment.dataUrl}
                            {...{ isIncoming, isOutgoing }}
                          />
                        </Animated.View>
                      );
                    }
                    if (attachment.fileType === 'image') {
                      return isAnInstagramStory && isInstagramStoryExpired ? (
                        <Animated.View
                          key={`expired-${index}`}
                          style={tailwind.style(
                            'flex flex-row items-center justify-center py-8 bg-slate-3 gap-1',
                          )}>
                          <Icon icon={<FileErrorIcon fill={tailwind.color('text-slate-12')} />} />
                          <Animated.Text
                            style={tailwind.style(
                              'text-cxs font-inter-420-20 text-slate-12 mt-[1px]',
                            )}>
                            {i18n.t('CONVERSATION.STORY_NOT_AVAILABLE')}
                          </Animated.Text>
                        </Animated.View>
                      ) : (
                        <Animated.View
                          key={attachment.fileType + index}
                          style={tailwind.style('my-2')}>
                          <ImageContainer
                            imageSrc={attachment.dataUrl}
                            width={300 - 24}
                            height={215}
                          />
                        </Animated.View>
                      );
                    }
                    if (attachment.fileType === 'file') {
                      return (
                        <Animated.View
                          key={attachment.fileType + index}
                          style={tailwind.style(
                            'flex flex-row items-center relative max-w-[300px] my-2',
                          )}>
                          <FilePreview
                            fileSrc={attachment.dataUrl}
                            isComposed
                            {...{ isIncoming, isOutgoing }}
                          />
                        </Animated.View>
                      );
                    }
                    if (attachment.fileType === 'video') {
                      return (
                        <Animated.View
                          key={attachment.fileType + index}
                          style={tailwind.style('flex flex-row items-center my-2')}>
                          <VideoPlayer videoSrc={attachment.dataUrl} />
                        </Animated.View>
                      );
                    }
                    return null;
                  })}
                <Animated.View
                  style={tailwind.style(
                    'h-[21px] pt-2 pb-0.5 flex flex-row items-center justify-end',
                  )}>
                  {isPrivate ? <Icon icon={<LockIcon />} size={12} /> : null}
                  <Text
                    style={tailwind.style(
                      'text-xs font-inter-420-20 tracking-[0.32px] pr-1',
                      isPrivate ? 'pl-1 text-slate-11' : '',
                      !isPrivate && isIncoming ? 'text-slate-11' : '',
                      !isPrivate && isOutgoing ? 'text-slate-11' : '',
                    )}>
                    {messageTimestamp(createdAt)}
                  </Text>
                  <DeliveryStatus
                    isPrivate={isPrivate}
                    status={status}
                    messageType={messageType}
                    channel={channel}
                    sourceId={sourceId}
                    errorMessage={errorMessage || ''}
                    deliveredColor="text-slate-11"
                    sentColor="text-slate-11"
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </MessageMenu>

        {shouldRenderAvatar && (isPrivate || isOutgoing || isTemplate) ? (
          <Animated.View style={tailwind.style('flex items-end justify-end ml-1')}>
            <Avatar size={'md'} src={getAvatarSource(sender)} name={sender?.name || ''} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
};
