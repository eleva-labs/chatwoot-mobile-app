import React from 'react';
import { Text } from 'react-native';

import { tailwind } from '@infrastructure/theme';
import { NativeView } from '@infrastructure/ui/native-components';
import { Icon } from '@infrastructure/ui/common/icon';
import { getChannelIcon } from '@infrastructure/utils';
import { Inbox } from '@domain/types/Inbox';
import { ConversationAdditionalAttributes } from '@domain/types/Conversation';
import { Channel } from '@domain/types';

type InboxIndicatorSize = 'sm' | 'md';

type InboxIndicatorProps = {
  inbox: Inbox;
  additionalAttributes?: ConversationAdditionalAttributes;
  size?: InboxIndicatorSize;
};

const sizeConfig: Record<InboxIndicatorSize, { icon: number; text: string }> = {
  sm: { icon: 10, text: 'text-xxs' }, // 10px icon, 10px text — for list items
  md: { icon: 12, text: 'text-xs' }, // 12px icon, 12px text — for chat header
};

export const InboxIndicator = ({
  inbox,
  additionalAttributes,
  size = 'sm',
}: InboxIndicatorProps) => {
  const { channelType = '', medium = '', name = '' } = inbox;
  const { type = '' } = additionalAttributes || {};
  const config = sizeConfig[size];

  if (!name) return null;

  return (
    <NativeView style={tailwind.style('flex-row items-center min-w-0')}>
      <NativeView style={tailwind.style('justify-center items-center flex-shrink-0')}>
        <Icon icon={getChannelIcon(channelType as Channel, medium, type)} size={config.icon} />
      </NativeView>
      <Text
        numberOfLines={1}
        style={tailwind.style(`${config.text} font-inter-normal-20 text-slate-11 ml-0.5`)}>
        {name}
      </Text>
    </NativeView>
  );
};
