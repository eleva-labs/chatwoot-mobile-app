import React from 'react';
import { Animated, Text } from 'react-native';

import { LockIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { messageTimestamp } from '@/utils';
import { Icon } from '@/components-next/common';

import { MarkdownDisplay } from './MarkdownDisplay';
import { TEXT_MAX_WIDTH } from '@/constants';

type PrivateTextCellProps = {
  text: string;
  timeStamp: number;
};

export const PrivateTextCell = (props: PrivateTextCellProps) => {
  const { text, timeStamp } = props;

  return (
    <Animated.View
      style={[
        tailwind.style(
          'relative max-w-[300px] pl-3 pr-2.5 py-2 rounded-t-2xl rounded-bl-2xl overflow-hidden bg-solid-amber',
          `max-w-[${TEXT_MAX_WIDTH}px]`,
        ),
      ]}>
      <MarkdownDisplay isPrivate messageContent={text} />
      <Animated.View
        style={tailwind.style('h-[21px] pt-2 pb-0.5 flex flex-row items-center justify-end')}>
        <Icon icon={<LockIcon />} size={12} />
        <Text
          style={tailwind.style('text-xs font-inter-420-20 tracking-[0.32px] pl-1 text-slate-11')}>
          {messageTimestamp(timeStamp)}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};
