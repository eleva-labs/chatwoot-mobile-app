import React from 'react';

import { tailwind, useThemeColors } from '@infrastructure/theme';
import { NativeView } from '@infrastructure/ui/native-components';
import { Icon } from '@infrastructure/ui/common/icon';
import { getChannelIcon } from '@infrastructure/utils';
import { Inbox } from '@domain/types/Inbox';
import { ConversationAdditionalAttributes } from '@domain/types/Conversation';
import { Channel } from '@domain/types';

type ChannelIndicatorProps = {
  inbox: Inbox;
  additionalAttributes?: ConversationAdditionalAttributes;
};

export const ChannelIndicator = (props: ChannelIndicatorProps) => {
  const { channelType = '', medium = '' } = props.inbox || {};
  const { type = '' } = props.additionalAttributes || {};
  const { colors } = useThemeColors();

  return (
    <NativeView
      style={[
        tailwind.style('pl-1 h-3 w-3 justify-center items-center'),
        { color: colors.slate[11] },
      ]}>
      <Icon icon={getChannelIcon(channelType as Channel, medium, type)} size={12} />
    </NativeView>
  );
};
