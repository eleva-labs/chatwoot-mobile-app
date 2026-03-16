import React from 'react';
import Animated from 'react-native-reanimated';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { SortTypes, SortOptions } from '@domain/types';
import { useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, SelectableListCell } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import i18n from '@infrastructure/i18n';
import { selectFilters, setFilters } from '@application/store/conversation/conversationFilterSlice';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

const sortByList = Object.keys(SortOptions) as SortTypes[];

const SortByStack = ({ list }: { list: SortTypes[] }) => {
  const { filtersModalSheetRef } = useRefsContext();
  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  const hapticSelection = useHaptic();

  const handlePress = (value: string) => {
    hapticSelection?.();
    dispatch(setFilters({ key: 'sort_by', value }));
    AnalyticsHelper.track(CONVERSATION_EVENTS.APPLY_FILTER, {
      filterType: 'sort_by',
      filterValue: value,
    });
    setTimeout(() => filtersModalSheetRef.current?.dismiss({ overshootClamping: true }), 1);
  };

  return (
    <Animated.View style={tailwind.style('py-1 pl-3')}>
      {list.map((value, index) => (
        <SelectableListCell
          key={value}
          label={i18n.t(`CONVERSATION.FILTERS.SORT_BY.OPTIONS.${value.toUpperCase()}`)}
          isSelected={filters.sort_by === value}
          isLastItem={index === list.length - 1}
          onPress={() => handlePress(value)}
        />
      ))}
    </Animated.View>
  );
};

export const SortByFilters = () => {
  return (
    <Animated.View>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.FILTERS.SORT_BY.TITLE')} />
      <SortByStack list={sortByList} />
    </Animated.View>
  );
};
