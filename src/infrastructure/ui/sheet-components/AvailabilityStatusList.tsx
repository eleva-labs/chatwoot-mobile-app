import React from 'react';
import { Pressable, Text, Animated } from 'react-native';

import { AVAILABILITY_STATUS_LIST } from '@domain/constants';
import { TickIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { AvailabilityStatus, AvailabilityStatusListItemType } from '@domain/types';
import { useHaptic } from '@infrastructure/utils';
import { Icon } from '@infrastructure/ui/common/icon';

type StatusCellProps = {
  item: AvailabilityStatusListItemType;
  index: number;
  availabilityStatus: string;
  changeAvailabilityStatus: (status: string) => void;
};

const StatusCell = ({
  item,
  index,
  availabilityStatus,
  changeAvailabilityStatus,
}: StatusCellProps) => {
  const themedTailwind = useThemedStyles();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    changeAvailabilityStatus(item.status);
  };

  const isLastItem = index === AVAILABILITY_STATUS_LIST.length - 1;
  const isSelected = availabilityStatus === item.status;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={themedTailwind.style('flex flex-row items-center')}>
        <Animated.View style={tailwind.style('h-4 w-4 rounded-full m-1.5', item.statusColor)} />
        <Animated.View
          style={themedTailwind.style(
            'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
            !isLastItem && 'border-b-[1px] border-slate-6',
          )}>
          <Text
            style={themedTailwind.style(
              'text-base capitalize text-slate-12 font-inter-420-20 leading-[21px] tracking-[0.16px]',
            )}>
            {item.status}
          </Text>
          {isSelected && <Icon icon={<TickIcon />} size={20} />}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const AvailabilityStatusList = ({
  availabilityStatus,
  changeAvailabilityStatus,
}: {
  availabilityStatus: string;
  changeAvailabilityStatus: (status: string) => void;
}) => {
  const themedTailwind = useThemedStyles();
  return (
    <Animated.View style={themedTailwind.style('py-1 pl-3')}>
      {AVAILABILITY_STATUS_LIST.map((item, index) => (
        <StatusCell
          key={item.status}
          item={item as AvailabilityStatusListItemType}
          index={index}
          availabilityStatus={availabilityStatus as AvailabilityStatus}
          changeAvailabilityStatus={changeAvailabilityStatus}
        />
      ))}
    </Animated.View>
  );
};
