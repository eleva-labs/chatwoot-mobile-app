import React from 'react';
import Animated from 'react-native-reanimated';
import { BottomSheetView } from '@gorhom/bottom-sheet';

import { useRefsContext } from '@infrastructure/context';
import { selectFilters, setFilters } from '@application/store/conversation/conversationFilterSlice';
import { tailwind } from '@infrastructure/theme';
import { StatusCollection, StatusOptions } from '@domain/types';
import { getStatusTypeIcon, useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, Icon, SelectableListCell } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import i18n from '@infrastructure/i18n';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

export const status: StatusCollection[] = [
  { id: 'all', icon: getStatusTypeIcon('all') },
  { id: 'open', icon: getStatusTypeIcon('open') },
  { id: 'pending', icon: getStatusTypeIcon('pending') },
  { id: 'snoozed', icon: getStatusTypeIcon('snoozed') },
  { id: 'resolved', icon: getStatusTypeIcon('resolved') },
];

const StatusStack = ({ statusList }: { statusList: StatusCollection[] }) => {
  const { filtersModalSheetRef } = useRefsContext();
  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  const hapticSelection = useHaptic();

  const handlePress = (statusId: string) => {
    hapticSelection?.();
    dispatch(setFilters({ key: 'status', value: statusId }));
    AnalyticsHelper.track(CONVERSATION_EVENTS.APPLY_FILTER, {
      filterType: 'status',
      filterValue: statusId,
    });
    setTimeout(() => filtersModalSheetRef.current?.dismiss({ overshootClamping: true }), 1);
  };

  return (
    <Animated.View style={tailwind.style('py-1 pl-3')}>
      {statusList.map((value, index) => (
        <SelectableListCell
          key={value.id}
          leftContent={
            <Animated.View>
              <Icon icon={value.icon} size={24} />
            </Animated.View>
          }
          label={i18n.t(
            `CONVERSATION.FILTERS.STATUS.OPTIONS.${StatusOptions[value.id].toUpperCase()}`,
          )}
          isSelected={filters.status === value.id}
          isLastItem={index === statusList.length - 1}
          onPress={() => handlePress(value.id)}
        />
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
