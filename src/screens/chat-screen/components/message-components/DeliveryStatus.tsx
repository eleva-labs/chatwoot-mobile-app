import React from 'react';
import { Pressable } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { spring } from '@infrastructure/animation';
import { CheckCheck, Clock } from 'lucide-react-native';
import { TickIcon } from '@/svg-icons/common/TickIcon';

import { BottomSheetBackdrop, BottomSheetWrapper } from '@infrastructure/ui';
import { useBottomSheetInset } from '@infrastructure/utils';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import { WarningIcon } from '@/svg-icons';
import { Icon } from '@infrastructure/ui/common';
import { MessageStatus, MessageType, Channel } from '@domain/types';
import { INBOX_TYPES, MESSAGE_TYPES, MESSAGE_STATUS } from '@domain/constants';
import { ErrorInformation } from './ErrorInformation';
import { useRefsContext } from '@infrastructure/context';

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

  const { colors, semanticColors } = useThemeColors();
  const bottomSheetInset = useBottomSheetInset();
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
    if (isAWhatsappChannel || isATwilioChannel || isAFacebookChannel || isASmsInbox) {
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
    const pendingColor = isOutgoing ? colors.slate[12] : semanticColors.textInverse;
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
        <Icon icon={<WarningIcon stroke={semanticColors.textInverse} />} size={14} />
        <BottomSheetModal
          ref={deliveryStatusSheetRef}
          backdropComponent={BottomSheetBackdrop}
          handleIndicatorStyle={tailwind.style(
            'overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]',
          )}
          enablePanDownToClose
          animationConfigs={spring.sheet}
          bottomInset={bottomSheetInset}
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
        icon={<CheckCheck size={ICON_SIZE} color={colors.blue[9]} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  if (showDeliveredIndicator()) {
    const deliveredIconColor = deliveredColor
      ? tailwind.color(deliveredColor)
      : semanticColors.textInverse;
    return (
      <Icon
        icon={<CheckCheck size={ICON_SIZE} color={deliveredIconColor} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  if (showSentIndicator()) {
    const sentIconColor = sentColor ? tailwind.color(sentColor) : semanticColors.textInverse;
    return (
      <Icon
        icon={<TickIcon size={ICON_SIZE} color={sentIconColor} strokeWidth={2} />}
        size={ICON_SIZE}
        color={null}
      />
    );
  }

  return null;
};
