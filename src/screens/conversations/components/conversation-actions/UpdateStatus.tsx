import React from 'react';
import Animated from 'react-native-reanimated';
import { BottomSheetView } from '@gorhom/bottom-sheet';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { ConversationStatus, StatusCollection, StatusOptions } from '@domain/types';
import { getStatusTypeIcon, useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, Icon, SelectableListCell } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import {
  selectSelectedConversation,
  selectSelectedIds,
} from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { setCurrentState } from '@application/store/conversation/conversationHeaderSlice';
import i18n from '@infrastructure/i18n';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

const StatusList: StatusCollection[] = [
  { id: 'open', icon: getStatusTypeIcon('open') },
  { id: 'pending', icon: getStatusTypeIcon('pending') },
  { id: 'snoozed', icon: getStatusTypeIcon('snoozed') },
  { id: 'resolved', icon: getStatusTypeIcon('resolved') },
];

const filterStatusList = (status: ConversationStatus) => {
  return StatusList.filter(item => item.id !== status);
};

export const UpdateStatus = () => {
  const { actionsModalSheetRef } = useRefsContext();

  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedIds);
  const selectedConversation = useAppSelector(selectSelectedConversation);
  const isMultipleConversationsSelected = selectedIds.length !== 0;
  const statusList = isMultipleConversationsSelected
    ? StatusList
    : filterStatusList(selectedConversation?.status || 'open');

  const hapticSelection = useHaptic();

  const handleStatusPress = (status: ConversationStatus) => {
    hapticSelection?.();
    if (isMultipleConversationsSelected) {
      const payload = { type: 'Conversation', ids: selectedIds, fields: { status } };
      dispatch(conversationActions.bulkAction(payload));
      AnalyticsHelper.track(CONVERSATION_EVENTS.TOGGLE_STATUS, {
        status,
        bulkAction: true,
        conversationCount: selectedIds.length,
      });
      actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
      dispatch(setCurrentState('none'));
    } else {
      if (!selectedConversation?.id) return;
      const previousStatus = selectedConversation?.status;
      dispatch(
        conversationActions.toggleConversationStatus({
          conversationId: selectedConversation?.id,
          payload: {
            status,
            snoozed_until: null,
          },
        }),
      );
      AnalyticsHelper.track(CONVERSATION_EVENTS.TOGGLE_STATUS, {
        conversationId: selectedConversation?.id,
        from: previousStatus,
        to: status,
      });
      if (status === 'resolved') {
        AnalyticsHelper.track(CONVERSATION_EVENTS.RESOLVE_CONVERSATION_STATUS, {
          conversationId: selectedConversation?.id,
        });
      }
      actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
    }
  };

  return (
    <BottomSheetView>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.CHANGE_STATUS')} />
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
              `CONVERSATION.ASSIGNEE.STATUS.OPTIONS.${StatusOptions[value.id].toUpperCase()}`,
            )}
            isLastItem={index === statusList.length - 1}
            onPress={() => handleStatusPress(value.id)}
          />
        ))}
      </Animated.View>
    </BottomSheetView>
  );
};
