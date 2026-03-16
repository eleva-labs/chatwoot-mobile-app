import React from 'react';
import { Animated } from 'react-native';

import { AVAILABILITY_STATUS_LIST } from '@domain/constants';
import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { AvailabilityStatus, AvailabilityStatusListItemType } from '@domain/types';
import { useHaptic } from '@infrastructure/utils';
import { SelectableListCell } from '@infrastructure/ui/list-components/SelectableListCell';

export const AvailabilityStatusList = ({
  availabilityStatus,
  changeAvailabilityStatus,
}: {
  availabilityStatus: string;
  changeAvailabilityStatus: (status: string) => void;
}) => {
  const themedTailwind = useThemedStyles();
  const hapticSelection = useHaptic();
  return (
    <Animated.View style={themedTailwind.style('py-1 pl-3')}>
      {(AVAILABILITY_STATUS_LIST as AvailabilityStatusListItemType[]).map((item, index) => (
        <SelectableListCell
          key={item.status}
          leftContent={
            <Animated.View style={tailwind.style('h-4 w-4 rounded-full m-1.5', item.statusColor)} />
          }
          label={item.status}
          isSelected={(availabilityStatus as AvailabilityStatus) === item.status}
          isLastItem={index === AVAILABILITY_STATUS_LIST.length - 1}
          onPress={() => {
            hapticSelection?.();
            changeAvailabilityStatus(item.status);
          }}
        />
      ))}
    </Animated.View>
  );
};
