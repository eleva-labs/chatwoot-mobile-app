import React from 'react';
import { Pressable } from 'react-native';
import { BottomSheetModal, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { Check, CheckCheck, Clock } from 'lucide-react-native';

import { BottomSheetBackdrop, BottomSheetWrapper } from '@/components-next';
import { tailwind } from '@/theme';
import { WarningIcon } from '@/svg-icons';
import { Icon } from '@/components-next/common';
import { MessageStatus, MessageType } from '@/types';
import { Channel } from '@/types';
import { INBOX_TYPES, MESSAGE_TYPES, MESSAGE_STATUS } from '@/constants';
import { ErrorInformation } from './ErrorInformation';
import { useRefsContext } from '@/context';

const READ_COLOR = '#7EB6FF';
const ICON_SIZE = 14;

type DeliveryStatusProps = {
  channel?: Channel;
  isPrivate: boolean;
  sourceId?: string | null;
  status: MessageStatus;
  messageType: MessageType;
  deliveredColor?: string;
  sentColor?: string;
  errorMessage: string;
};

export const DeliveryStatus = (props: DeliveryStatusProps) => {
  const {
    channel,
    isPrivate,
    status,
    messageType,
    sourceId,
    deliveredColor,
    sentColor,
    errorMessage,
  } = props;

  const { deliveryStatusSheetRef } = useRefsContext();

  const isDelivered = status === MESSAGE_STATUS.DELIVERED;
  const isRead = status === MESSAGE_STATUS.READ;
  const isSent = status === MESSAGE_STATUS.SENT;
  const isFailed = status === MESSAGE_STATUS.FAILED;
  const isEmailChannel = channel === INBOX_TYPES.EMAIL;
  const isAWhatsappChannel = channel === INBOX_TYPES.TWILIO || channel === INBOX_TYPES.WHATSAPP;
  const isATelegramChannel = channel === INBOX_TYPES.TELEGRAM;
  const isATwilioChannel = channel === INBOX_TYPES.TWILIO;
  const isAFacebookChannel = channel === INBOX_TYPES.FB;
  const isAWebWidgetChannel = channel === INBOX_TYPES.WEB;
  const isTemplate = messageType === MESSAGE_TYPES.TEMPLATE;
  const isASmsInbox = channel === INBOX_TYPES.SMS;
  const isAPIChannel = channel === INBOX_TYPES.API;
  const isAnInstagramChannel = channel === INBOX_TYPES.INSTAGRAM;
  const isPending = status === MESSAGE_STATUS.PROGRESS;
  const isOutgoing = messageType === MESSAGE_TYPES.OUTGOING;
  const shouldShowStatusIndicator =
    (messageType === MESSAGE_TYPES.OUTGOING || isTemplate) && !isPrivate;
  const isALineChannel = channel === INBOX_TYPES.LINE;

  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 30,
  });

  const showSentIndicator = () => {
    if (!shouldShowStatusIndicator) {
      return false;
    }

    if (isEmailChannel) {
      return !!sourceId;
    }

    if (
      isAWhatsappChannel ||
      isATwilioChannel ||
      isAFacebookChannel ||
      isATelegramChannel ||
      isASmsInbox ||
      isAnInstagramChannel
    ) {
      return sourceId && isSent;
    }
    // There is no source id for the line channel
    if (isALineChannel) {
      return true;
    }

    return false;
  };

  const showDeliveredIndicator = () => {
    if (!shouldShowStatusIndicator) {
      return false;
    }
    if (
      isAWhatsappChannel ||
      isATwilioChannel ||
      isAFacebookChannel ||
      isASmsInbox ||
      isAnInstagramChannel
    ) {
      return sourceId && isDelivered;
    }

    // We will consider messages as delivered for web widget inbox and API inbox if they are sent
    if (isAWebWidgetChannel || isAPIChannel) {
      return isSent;
    }

    if (isALineChannel) {
      return isDelivered;
    }

    return false;
  };

  const showReadIndicator = () => {
    if (!shouldShowStatusIndicator) {
      return false;
    }
    if (isAWebWidgetChannel || isAPIChannel) {
      return isRead;
    }

    if (isAWhatsappChannel || isATwilioChannel || isAFacebookChannel || isAnInstagramChannel) {
      return sourceId && isRead;
    }

    return false;
  };

  if (isPending) {
    const pendingColor = isOutgoing
      ? (tailwind.color('text-blackA-A12') ?? '#000000')
      : (tailwind.color('text-whiteA-A12') ?? '#FFFFFF');
    return (
      <Icon
        icon={<Clock size={ICON_SIZE} color={pendingColor} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  if (isFailed) {
    return (
      <Pressable onPress={() => deliveryStatusSheetRef.current?.present()}>
        <Icon icon={<WarningIcon stroke={tailwind.color('text-whiteA-A11')} />} size={14} />
        <BottomSheetModal
          ref={deliveryStatusSheetRef}
          backdropComponent={BottomSheetBackdrop}
          handleIndicatorStyle={tailwind.style(
            'overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]',
          )}
          enablePanDownToClose
          animationConfigs={animationConfigs}
          handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
          style={tailwind.style('rounded-[26px] overflow-hidden')}
          snapPoints={['15']}>
          <BottomSheetWrapper>
            <ErrorInformation errorMessage={errorMessage} />
          </BottomSheetWrapper>
        </BottomSheetModal>
      </Pressable>
    );
  }

  if (showReadIndicator()) {
    return (
      <Icon
        icon={<CheckCheck size={ICON_SIZE} color={READ_COLOR} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  if (showDeliveredIndicator()) {
    const deliveredIconColor = tailwind.color(deliveredColor ?? 'text-whiteA-A12') ?? '#FFFFFF';
    return (
      <Icon
        icon={<CheckCheck size={ICON_SIZE} color={deliveredIconColor} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  if (showSentIndicator()) {
    const sentIconColor = tailwind.color(sentColor ?? 'text-whiteA-A12') ?? '#FFFFFF';
    return (
      <Icon
        icon={<Check size={ICON_SIZE} color={sentIconColor} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  return null;
};
