import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { TickIcon } from '@/svg-icons/common/TickIcon';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { ConversationPriority, PriorityOptions } from '@domain/types';
import { useHaptic } from '@infrastructure/utils';
import { BottomSheetHeader, PriorityIndicator } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { selectSelectedConversation } from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';

import i18n from '@infrastructure/i18n';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';
import { showToast } from '@infrastructure/utils/toastUtils';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';

type PriorityCellProps = {
  value: {
    id: string;
  };
  isLastItem: boolean;
  selectedPriority: ConversationPriority | undefined;
  onPress: () => void;
};

const PriorityList = [
  { id: 'none' },
  { id: 'low' },
  { id: 'medium' },
  { id: 'high' },
  { id: 'urgent' },
];

const PriorityCell = (props: PriorityCellProps) => {
  const { value, isLastItem, onPress, selectedPriority } = props;
  return (
    <Pressable onPress={() => onPress()} style={tailwind.style('flex flex-row items-center')}>
      <Animated.View style={tailwind.style('w-6 items-center justify-center')}>
        {value.id !== 'none' && <PriorityIndicator priority={value.id as ConversationPriority} />}
      </Animated.View>
      <Animated.View
        style={tailwind.style(
          'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
          !isLastItem ? 'border-b-[1px] border-slate-6' : '',
        )}>
        <Animated.Text
          style={tailwind.style(
            'text-base text-slate-12 font-inter-420-20 leading-[21px] tracking-[0.16px] capitalize',
          )}>
          {i18n.t(`CONVERSATION.PRIORITY.OPTIONS.${PriorityOptions[value.id].toUpperCase()}`)}
        </Animated.Text>
        {selectedPriority === value.id ? (
          <TickIcon size={20} color={tailwind.color('text-slate-12')} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

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
          <PriorityCell
            key={index}
            {...{ value, isLastItem: index === PriorityList.length - 1 }}
            onPress={() => handlePriorityPress(value.id as ConversationPriority)}
            selectedPriority={selectedConversation?.priority}
          />
        ))}
      </Animated.View>
    </BottomSheetView>
  );
};
