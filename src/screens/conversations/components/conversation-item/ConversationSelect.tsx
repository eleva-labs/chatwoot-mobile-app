/* eslint-disable react/display-name */
import React, { memo } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { Icon } from '@infrastructure/ui/common';
import { AnimatedNativeView } from '@infrastructure/ui/native-components';
import { CheckedIcon, UncheckedIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';

type ConversationSelectProps = {
  isSelected: boolean;
  currentState: string;
};

export const ConversationSelect = memo((props: ConversationSelectProps) => {
  const { isSelected, currentState } = props;

  return currentState === 'Select' ? (
    <AnimatedNativeView
      layout={LinearTransition.springify().damping(28).stiffness(200)}
      style={tailwind.style('h-full pt-[23px] pr-3')}>
      <Icon icon={isSelected ? <CheckedIcon /> : <UncheckedIcon />} size={20} />
    </AnimatedNativeView>
  ) : null;
});
