import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import Animated from 'react-native-reanimated';
import { contentFadeIn } from '@infrastructure/animation';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { FileIcon } from '@/svg-icons';
import { tailwind, textCaptionBook } from '@infrastructure/theme';
import i18n from '@infrastructure/i18n';
import { Channel, Message, MessageStatus, UnixTimestamp } from '@domain/types';
import { getAvatarSource, messageTimestamp } from '@infrastructure/utils';
import { Avatar, Icon } from '@infrastructure/ui/common';
import { Spinner } from '@infrastructure/ui/spinner';
import { MenuOption, MessageMenu } from '../message-menu';
import { MESSAGE_TYPES } from '@domain/constants';
import { DeliveryStatus } from './DeliveryStatus';

type FilePreviewProps = Pick<FileCellProps, 'fileSrc'> & {
  isIncoming: boolean;
  isOutgoing: boolean;
  isComposed?: boolean;
};

export const FilePreview = (props: FilePreviewProps) => {
  const { fileSrc, isIncoming, isOutgoing, isComposed = false } = props;
  const dirs = ReactNativeBlobUtil.fs.dirs;

  const [fileDownload, setFileDownload] = useState(false);
  const fileName = fileSrc.split('/')[fileSrc.split('/').length - 1];
  const localFilePath = dirs.DocumentDir + `/${fileName}`;

  const previewFile = () => {
    try {
      FileViewer.open(localFilePath).catch(e => Alert.alert(e));
    } catch (e) {
      Alert.alert(i18n.t('FILES.PREVIEW_ERROR') + e);
    }
  };

  useEffect(() => {
    const asyncFileDownload = () => {
      ReactNativeBlobUtil.fs.exists(localFilePath).then(res => {
        if (res) {
          setFileDownload(false);
        } else {
          setFileDownload(true);
          ReactNativeBlobUtil.config({
            overwrite: true,
            path: localFilePath,
            fileCache: true,
          })
            .fetch('GET', fileSrc)
            .then(_result => {
              setFileDownload(false);
            })
            .catch(() => {
              Alert.alert(i18n.t('FILES.LOAD_ERROR'));
            });
        }
      });
    };
    asyncFileDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <React.Fragment>
      {fileDownload ? (
        <Animated.View style={tailwind.style('pr-1.5')}>
          <Spinner
            size={20}
            stroke={isIncoming ? tailwind.color('text-white') : tailwind.color('bg-brand')}
          />
        </Animated.View>
      ) : (
        <Animated.View style={tailwind.style('pr-1.5')}>
          <Icon
            size={24}
            icon={
              <FileIcon
                fill={isIncoming ? tailwind.color('bg-solid-1') : tailwind.color('text-brand')}
              />
            }
          />
        </Animated.View>
      )}
      <Pressable hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={previewFile}>
        <Animated.View style={tailwind.style('relative')}>
          <Animated.Text
            numberOfLines={1}
            ellipsizeMode={'middle'}
            style={[
              tailwind.style(
                isComposed ? 'max-w-[248px]' : 'max-w-[170px]',
                isIncoming || isOutgoing
                  ? 'text-base tracking-[0.32px] leading-[22px] font-inter-normal-20'
                  : '',
                isIncoming ? 'text-white' : '',
                isOutgoing ? 'text-brand' : '',
              ),
              style.androidTextOnlyStyle,
            ]}>
            {fileName}
          </Animated.Text>
          <Animated.View
            style={[
              tailwind.style(
                'border-b-[1px] absolute left-0 right-0 ios:bottom-[1px] android:bottom-0',
                isIncoming ? 'border-white' : '',
                isOutgoing ? 'border-brand' : '',
              ),
            ]}
          />
        </Animated.View>
      </Pressable>
    </React.Fragment>
  );
};

type FileCellProps = {
  fileSrc: string;
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

export const FileCell = (props: FileCellProps) => {
  const {
    fileSrc,
    sender,
    shouldRenderAvatar,
    messageType,
    timeStamp,
    status,
    menuOptions,
    isPrivate,
    channel,
    sourceId,
    errorMessage,
  } = props;

  const isIncoming = messageType === MESSAGE_TYPES.INCOMING;
  const isOutgoing = messageType === MESSAGE_TYPES.OUTGOING;

  return (
    <Animated.View
      entering={contentFadeIn()}
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
                'flex flex-row items-center relative max-w-[300px] pl-3 pr-2.5 py-2 rounded-2xl overflow-hidden',
                isIncoming ? 'bg-brand' : '',
                isOutgoing ? 'bg-slate-3' : '',
                shouldRenderAvatar
                  ? isOutgoing
                    ? 'rounded-br-none'
                    : isIncoming
                      ? 'rounded-bl-none'
                      : ''
                  : '',
              ),
            ]}>
            <FilePreview {...{ fileSrc, isIncoming, isOutgoing }} />
            <Animated.View
              style={tailwind.style('h-[21px] pt-2 pb-0.5 flex flex-row items-center pl-1.5')}>
              <Animated.Text
                style={tailwind.style(
                  `${textCaptionBook} tracking-[0.32px] leading-[14px] pr-1`,
                  isIncoming ? 'text-whiteA-A11' : '',
                  isOutgoing ? 'text-slate-11' : '',
                )}>
                {messageTimestamp(timeStamp)}
              </Animated.Text>
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

const style = StyleSheet.create({
  androidTextOnlyStyle: { includeFontPadding: false },
});
