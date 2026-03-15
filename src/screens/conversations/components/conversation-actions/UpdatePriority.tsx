import React from 'react';
import Animated from 'react-native-reanimated';
import { BottomSheetView } from '@gorhom/bottom-sheet';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { ConversationPriority, PriorityOptions } from '@domain/types';
import { useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, PriorityIndicator, SelectableListCell } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { selectSelectedConversation } from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';

import i18n from '@infrastructure/i18n';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';
import { showToast } from '@infrastructure/utils/toastUtils';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';

const PriorityList = [
  { id: 'none' },
  { id: 'low' },
  { id: 'medium' },
  { id: 'high' },
  { id: 'urgent' },
];

export const UpdatePriority = () => {
  const { actionsModalSheetRef } = useRefsContext();

  const dispatch = useAppDispatch();
  const selectedConversation = useAppSelector(selectSelectedConversation);

  const hapticSelection = useHaptic();

  const handlePriorityPress = async (priority: ConversationPriority) => {
    hapticSelection?.();
    if (!selectedConversation?.id) return;
    await dispatch(
      conversationActions.togglePriority({
        conversationId: selectedConversation?.id,
        priority,
      }),
    );
    AnalyticsHelper.track(CONVERSATION_EVENTS.PRIORITY_CHANGED);
    showToast({
      message: i18n.t('CONVERSATION.PRIORITY_CHANGE'),
    });
    actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
  };

  return (
    <BottomSheetView>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.CHANGE_PRIORITY')} />
      <Animated.View style={tailwind.style('py-1 pl-3')}>
        {PriorityList.map((value, index) => (
          <SelectableListCell
            key={value.id}
            leftContent={
              <Animated.View style={tailwind.style('w-6 items-center justify-center')}>
                {value.id !== 'none' && (
                  <PriorityIndicator priority={value.id as ConversationPriority} />
                )}
              </Animated.View>
            }
            label={i18n.t(
              `CONVERSATION.PRIORITY.OPTIONS.${PriorityOptions[value.id].toUpperCase()}`,
            )}
            isSelected={selectedConversation?.priority === value.id}
            isLastItem={index === PriorityList.length - 1}
            onPress={() => handlePriorityPress(value.id as ConversationPriority)}
          />
        ))}
      </Animated.View>
    </BottomSheetView>
  );
};
