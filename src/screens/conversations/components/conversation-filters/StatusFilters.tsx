import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetView } from '@gorhom/bottom-sheet';

import { useRefsContext } from '@infrastructure/context';
import { selectFilters, setFilters } from '@application/store/conversation/conversationFilterSlice';
import { TickIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { StatusCollection } from '@domain/types';
import { getStatusTypeIcon, useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, Icon } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@/hooks';
import i18n from '@infrastructure/i18n';
import { StatusOptions } from '@domain/types';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

type StatusCellProps = {
  value: StatusCollection;
  index: number;
};

export const status: StatusCollection[] = [
  { id: 'all', icon: getStatusTypeIcon('all') },
  { id: 'open', icon: getStatusTypeIcon('open') },
  { id: 'pending', icon: getStatusTypeIcon('pending') },
  { id: 'snoozed', icon: getStatusTypeIcon('snoozed') },
  { id: 'resolved', icon: getStatusTypeIcon('resolved') },
];

const StatusCell = (props: StatusCellProps) => {
  const { filtersModalSheetRef } = useRefsContext();
  const { value, index } = props;
  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  const hapticSelection = useHaptic();

  const handleStatusPress = () => {
    hapticSelection?.();
    dispatch(setFilters({ key: 'status', value: value.id }));
    AnalyticsHelper.track(CONVERSATION_EVENTS.APPLY_FILTER, {
      filterType: 'status',
      filterValue: value.id,
    });
    setTimeout(() => filtersModalSheetRef.current?.dismiss({ overshootClamping: true }), 1);
  };

  return (
    <Pressable onPress={handleStatusPress} style={tailwind.style('flex flex-row items-center')}>
      <Animated.View>
        <Icon icon={value.icon} size={24} />
      </Animated.View>
      <Animated.View
        style={tailwind.style(
          'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
          index !== status.length - 1 ? 'border-b-[1px] border-slate-6' : '',
        )}>
        <Animated.Text
          style={tailwind.style(
            'text-base text-slate-12 font-inter-420-20 leading-[21px] tracking-[0.16px] capitalize',
          )}>
          {i18n.t(`CONVERSATION.FILTERS.STATUS.OPTIONS.${StatusOptions[value.id].toUpperCase()}`)}
        </Animated.Text>
        {filters.status === value.id ? <Icon icon={<TickIcon />} size={20} /> : null}
      </Animated.View>
    </Pressable>
  );
};

type StatusStackProps = {
  statusList: StatusCollection[];
};

const StatusStack = (props: StatusStackProps) => {
  const { statusList } = props;
  const list = statusList;
  return (
    <Animated.View style={tailwind.style('py-1 pl-3')}>
      {list.map((value, index) => (
        <StatusCell key={index} {...{ value, index }} />
      ))}
    </Animated.View>
  );
};

export const StatusFilters = () => {
  return (
    <BottomSheetView>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.FILTERS.STATUS.TITLE')} />
      <StatusStack statusList={status} />
    </BottomSheetView>
  );
};
