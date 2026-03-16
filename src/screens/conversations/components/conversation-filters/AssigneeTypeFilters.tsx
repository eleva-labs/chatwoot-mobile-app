import React from 'react';
import Animated from 'react-native-reanimated';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { AssigneeTypes, AssigneeOptions } from '@domain/types';
import { useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, SelectableListCell } from '@infrastructure/ui';
import { selectFilters, setFilters } from '@application/store/conversation/conversationFilterSlice';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import i18n from '@infrastructure/i18n';
import { useUserPermissions } from '@infrastructure/hooks/useConversationPermission';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

const assigneeTypeList = Object.keys(AssigneeOptions) as AssigneeTypes[];

export const AssigneeTypeFilters = () => {
  const userPermissions = useUserPermissions();
  const { filtersModalSheetRef } = useRefsContext();
  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  const hapticSelection = useHaptic();

  // If userPermissions contains any values conversation_manage_permission,administrator, agent then keep all the assignee types
  // If conversation_manage is not available and conversation_unassigned_manage only is available, then return only unassigned and mine
  // If conversation_manage is not available and conversation_participating_manage only is available, then return only all and mine
  let assigneeTypes = assigneeTypeList;

  if (
    userPermissions.includes('conversation_manage') ||
    userPermissions.includes('agent') ||
    userPermissions.includes('administrator')
  ) {
    // Keep all the assignee types
  } else if (userPermissions.includes('conversation_unassigned_manage')) {
    assigneeTypes = assigneeTypeList.filter(type => type !== 'all');
  } else {
    assigneeTypes = assigneeTypeList.filter(type => type !== 'unassigned');
  }

  const handlePress = (value: string) => {
    hapticSelection?.();
    dispatch(setFilters({ key: 'assignee_type', value }));
    AnalyticsHelper.track(CONVERSATION_EVENTS.APPLY_FILTER, {
      filterType: 'assignee_type',
      filterValue: value,
    });
    setTimeout(() => filtersModalSheetRef.current?.dismiss({ overshootClamping: true }), 1);
  };

  return (
    <Animated.View>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.FILTERS.ASSIGNEE_TYPE.TITLE')} />
      <Animated.View style={tailwind.style('py-1 pl-3')}>
        {assigneeTypes.map((value, index) => (
          <SelectableListCell
            key={value}
            label={i18n.t(`CONVERSATION.FILTERS.ASSIGNEE_TYPE.OPTIONS.${value.toUpperCase()}`)}
            isSelected={filters.assignee_type === value}
            isLastItem={index === assigneeTypes.length - 1}
            onPress={() => handlePress(value)}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
};
