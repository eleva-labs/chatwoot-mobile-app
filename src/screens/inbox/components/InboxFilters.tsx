import React from 'react';
import Animated from 'react-native-reanimated';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, SelectableListCell } from '@infrastructure/ui';
import i18n from '@infrastructure/i18n';
import {
  InboxSortTypes,
  InboxSortOptions,
} from '@application/store/notification/notificationTypes';
import {
  selectSortOrder,
  setFilters,
} from '@application/store/notification/notificationFilterSlice';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';

const sortByList = Object.keys(InboxSortOptions) as InboxSortTypes[];

export const InboxFilters = () => {
  const sortOrder = useAppSelector(selectSortOrder);
  const dispatch = useAppDispatch();
  const { inboxFiltersSheetRef } = useRefsContext();
  const hapticSelection = useHaptic();

  const handleChangeFilters = (value: InboxSortTypes) => {
    hapticSelection?.();
    dispatch(setFilters({ key: value }));
    setTimeout(() => inboxFiltersSheetRef.current?.dismiss({ overshootClamping: true }), 1);
  };

  return (
    <Animated.View>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.FILTERS.SORT_BY.TITLE')} />
      <Animated.View style={tailwind.style('py-1 pl-3')}>
        {sortByList.map((value, index) => (
          <SelectableListCell
            key={value}
            label={i18n.t(`NOTIFICATION.FILTERS.SORT_BY.OPTIONS.${value.toUpperCase()}`)}
            isSelected={sortOrder === value}
            isLastItem={index === sortByList.length - 1}
            onPress={() => handleChangeFilters(value)}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
};
