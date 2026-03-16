import React from 'react';
import Animated from 'react-native-reanimated';

import { tailwind } from '@infrastructure/theme';
import { Label } from '@domain/types/common/Label';
import { SelectableListCell } from '@infrastructure/ui/list-components/SelectableListCell';

type LabelCellProps = {
  value: Label;
  index: number;
  handleLabelPress: (labelText: string) => void;
  isLastItem: boolean;
  isActive?: boolean;
};

export const LabelCell = (props: LabelCellProps) => {
  const { value, isLastItem, handleLabelPress, isActive = false } = props;

  return (
    <SelectableListCell
      leftContent={
        <Animated.View
          style={tailwind.style('h-4 w-4 rounded-full ml-1.5', `bg-[${value.color}]`)}
        />
      }
      label={value.title}
      isSelected={isActive}
      isLastItem={isLastItem}
      onPress={() => handleLabelPress(value.title)}
    />
  );
};
