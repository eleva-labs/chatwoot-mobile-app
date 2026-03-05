import React, { useState, useCallback } from 'react';
import { Text } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import { CircleOff } from 'lucide-react-native';
import { tailwind } from '@infrastructure/theme';
import { Channel, Message, MessageStatus, UnixTimestamp } from '@domain/types';
import { getAvatarSource, messageTimestamp } from '@infrastructure/utils';
import { Avatar } from '@infrastructure/ui/common';
import { MenuOption, MessageMenu } from '../message-menu';
import { MESSAGE_TYPES } from '@domain/constants';
import { DeliveryStatus } from './DeliveryStatus';
import i18n from '@infrastructure/i18n';

type ImageCellProps = {
  imageSrc: string;
  shouldRenderAvatar: boolean;
  messageType: number;
  sender: Message['sender'];
  timeStamp: UnixTimestamp;
  status: MessageStatus;
  channel?: Channel;
  isPrivate: boolean;
  sourceId?: string | null;
  menuOptions: MenuOption[];
  errorMessage?: string;
};

export const ImageCell = (props: ImageCellProps) => {
  const {
    imageSrc,
    shouldRenderAvatar,
    messageType,
    sender,
    timeStamp,
    channel,
    isPrivate,
    sourceId,
    status,
    menuOptions,
    errorMessage,
  } = props;

  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setHasImageError(true);
  }, []);

  const isIncoming = messageType === MESSAGE_TYPES.INCOMING;
  const isOutgoing = messageType === MESSAGE_TYPES.OUTGOING;

  return (
    <Animated.View
      entering={FadeIn.duration(300).easing(Easing.ease)}
      style={tailwind.style(
        'w-full my-[1px]',
        isIncoming && 'items-start',
        isOutgoing && 'items-end',
        !shouldRenderAvatar && isIncoming ? 'ml-7' : '',
        !shouldRenderAvatar && isOutgoing ? 'pr-7' : '',
        shouldRenderAvatar ? 'pb-2' : '',
      )}>
      <Animated.View style={tailwind.style('flex flex-row')}>
        {sender?.name && isIncoming && shouldRenderAvatar ? (
          <Animated.View style={tailwind.style('flex items-end justify-end mr-1')}>
            <Avatar size={'md'} src={getAvatarSource(sender)} name={sender?.name} />
          </Animated.View>
        ) : null}
        <MessageMenu menuOptions={menuOptions}>
          <Animated.View
            style={[
              tailwind.style(
                'relative pl-3 pr-2.5 py-2 rounded-2xl overflow-hidden',
                isIncoming ? 'bg-slate-4' : '',
                isOutgoing ? 'bg-solid-blue' : '',
                isPrivate ? ' bg-amber-3' : '',
                shouldRenderAvatar
                  ? isOutgoing
                    ? 'rounded-br-none'
                    : isIncoming
                      ? 'rounded-bl-none'
                      : ''
                  : '',
              ),
            ]}>
            <Animated.View
              style={tailwind.style(
                'relative w-[300px] rounded-[14px] overflow-hidden',
                shouldRenderAvatar
                  ? isOutgoing
                    ? 'rounded-br-none'
                    : isIncoming
                      ? 'rounded-bl-none'
                      : ''
                  : '',
              )}>
              {hasImageError ? (
                <Animated.View
                  style={tailwind.style(
                    'bg-slate-3 rounded-lg items-center justify-center h-[215px]',
                  )}>
                  <CircleOff size={24} color={tailwind.color('text-slate-11')} strokeWidth={1.5} />
                  <Animated.Text
                    style={tailwind.style(
                      'text-xs font-inter-420-20 tracking-[0.32px] text-slate-11 mt-2',
                    )}>
                    {i18n.t('CONVERSATION.IMAGE_LOAD_ERROR')}
                  </Animated.Text>
                </Animated.View>
              ) : (
                <>
                  <Image
                    source={{ uri: imageSrc }}
                    contentFit="cover"
                    onError={handleImageError}
                    style={[tailwind.style('w-full bg-slate-3 overflow-hidden'), { height: 215 }]}
                  />
                  <Animated.View pointerEvents={'none'}>
                    <ImageBackground
                      source={require('../../../../assets/local/ImageCellTimeStampOverlay.png')} // eslint-disable-line @typescript-eslint/no-require-imports
                      style={tailwind.style(
                        'absolute bottom-0 right-0 h-15 w-33 z-10',
                        shouldRenderAvatar
                          ? isOutgoing
                            ? 'rounded-br-none'
                            : isIncoming
                              ? 'rounded-bl-none'
                              : ''
                          : '',
                      )}>
                      <Animated.View
                        style={tailwind.style('flex flex-row absolute right-3 bottom-[5px]')}>
                        <Text
                          style={tailwind.style(
                            'text-xs font-inter-420-20 tracking-[0.32px] leading-[14px] text-whiteA-A12 pr-1',
                          )}>
                          {messageTimestamp(timeStamp)}
                        </Text>
                        <DeliveryStatus
                          messageType={messageType}
                          status={status}
                          channel={channel}
                          isPrivate={isPrivate}
                          sourceId={sourceId}
                          errorMessage={errorMessage || ''}
                        />
                      </Animated.View>
                    </ImageBackground>
                  </Animated.View>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </MessageMenu>
        {sender?.name && isOutgoing && shouldRenderAvatar ? (
          <Animated.View style={tailwind.style('flex items-end justify-end ml-1')}>
            <Avatar size={'md'} src={getAvatarSource(sender)} name={sender?.name} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
};
