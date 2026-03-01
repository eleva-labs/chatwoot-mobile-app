import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

import { tailwind } from '@infrastructure/theme';
import { Label } from '@domain/types/common/Label';

type LabelCellProps = {
  value: Label;
  index: number;
  handleLabelPress: (labelText: string) => void;
  isLastItem: boolean;
  isActive?: boolean;
};

export const LabelCell = (props: LabelCellProps) => {
  const { value, isLastItem, handleLabelPress, isActive = false } = props;

  const handleOnPress = () => {
    handleLabelPress(value.title);
  };

  return (
    <Pressable onPress={handleOnPress} style={tailwind.style('flex flex-row items-center pl-1.5')}>
      <Animated.View style={tailwind.style('h-4 w-4 rounded-full', `bg-[${value.color}]`)} />
      <Animated.View
        style={tailwind.style(
          'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
          !isLastItem ? 'border-b-[1px] border-slate-6' : '',
        )}>
        <Animated.Text
          style={[
            tailwind.style(
              'text-base text-slate-12 font-inter-420-20 leading-[21px] tracking-[0.16px]',
            ),
          ]}>
          {value.title}
        </Animated.Text>
        {isActive ? <Check size={20} color={tailwind.color('text-slate-12')} /> : null}
      </Animated.View>
    </Pressable>
  );
};
