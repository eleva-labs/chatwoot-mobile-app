import React from 'react';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { Label } from '@/types';
import { LabelPill } from './LabelPill';

type LabelItemProps = {
  item: Label;
  index: number;
};

export const LabelItem = (props: LabelItemProps) => {
  const { item } = props;
  return (
    <Animated.View style={tailwind.style('mr-2 mt-3')}>
      <LabelPill labelText={item.title} labelColor={item.color} />
    </Animated.View>
  );
};
