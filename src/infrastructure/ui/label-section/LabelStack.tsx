import React from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { tailwind } from '@infrastructure/theme';
import { Label } from '@domain/types/common/Label';
import { LabelCell } from './LabelCell';

type LabelStackProps = {
  labels: Label[];
  selectedLabels: string[];
  onLabelPress: (labelTitle: string) => void;
};

export const LabelStack = (props: LabelStackProps) => {
  const { labels, onLabelPress, selectedLabels } = props;

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false} style={tailwind.style('my-1 pl-3')}>
      {labels.map((value, index) => {
        return (
          <LabelCell
            key={value.title}
            {...{ value, index }}
            handleLabelPress={onLabelPress}
            isActive={selectedLabels.includes(value.title)}
            isLastItem={index === labels.length - 1}
          />
        );
      })}
    </BottomSheetScrollView>
  );
};
