import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { useChatWindowContext, useRefsContext } from '@infrastructure/context';
import { LabelTag } from '@/svg-icons';
import { tailwind, useBoxShadow, textLabel } from '@infrastructure/theme';
import { Icon } from '@infrastructure/ui';
import { useSheetDefaults } from '@infrastructure/utils';
import i18n from '@infrastructure/i18n';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { filterLabels } from '@application/store/label/labelSelectors';
import { conversationActions } from '@application/store/conversation/conversationActions';

import { LabelItemRemovable } from '@infrastructure/ui/label-section';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { LABEL_EVENTS } from '@domain/constants/analyticsEvents';
import { LabelPicker } from '@infrastructure/ui/label-picker';

interface LabelSectionProps {
  labels: string[];
}

export const ConversationLabelActions = (props: LabelSectionProps) => {
  const { labels } = props;
  const sheetDefaults = useSheetDefaults();
  const { conversationId } = useChatWindowContext();
  const dispatch = useAppDispatch();
  const cardShadow = useBoxShadow('card');

  const [selectedLabels, setSelectedLabels] = useState(labels);

  const { addLabelSheetRef } = useRefsContext();

  const allLabels = useAppSelector(state => filterLabels(state, ''));

  const conversationLabels =
    allLabels && selectedLabels
      ? allLabels.filter(({ title }) => {
          return selectedLabels?.includes(title);
        })
      : [];

  const handleAddLabelPress = () => {
    addLabelSheetRef.current?.present();
  };

  const handleAddOrUpdateLabels = useCallback(
    async (label: string) => {
      setSelectedLabels(prevLabels => {
        const isRemoving = prevLabels.includes(label);
        const updatedLabels = isRemoving
          ? prevLabels.filter(item => item !== label)
          : [...prevLabels, label];

        dispatch(
          conversationActions.addOrUpdateConversationLabels({
            conversationId: conversationId,
            labels: updatedLabels,
          }),
        );

        AnalyticsHelper.track(LABEL_EVENTS.APPLY_LABEL, {
          conversationId,
          label,
          action: isRemoving ? 'remove' : 'add',
        });

        return updatedLabels;
      });
    },
    [dispatch, conversationId],
  );
  return (
    <Animated.View>
      <Animated.View style={tailwind.style('pl-4')}>
        <Animated.Text
          style={tailwind.style(`${textLabel} leading-[16px] tracking-[0.32px] text-slate-11`)}>
          {i18n.t('CONVERSATION.ACTIONS.LABELS.TITLE')}
        </Animated.Text>
      </Animated.View>
      <Animated.View style={tailwind.style('flex flex-row flex-wrap gap-2 pl-4')}>
        {conversationLabels.map(label => (
          <Animated.View key={label.title} style={tailwind.style('mt-3')}>
            <LabelItemRemovable
              title={label.title}
              color={label.color}
              onRemove={() => handleAddOrUpdateLabels(label.title)}
            />
          </Animated.View>
        ))}
        <Pressable
          onPress={handleAddLabelPress}
          style={({ pressed }) => [
            tailwind.style(
              'flex flex-row items-center bg-solid-1 px-3 py-[7px] rounded-lg mr-2 mt-3',
              pressed ? 'bg-iris-3' : '',
            ),
            { boxShadow: cardShadow },
          ]}>
          <Icon icon={<LabelTag />} size={16} />
          <Animated.Text
            style={tailwind.style(
              'text-md font-inter-medium-24 leading-[17px] tracking-[0.24px] pl-1.5 text-iris-11',
            )}>
            {i18n.t('CONVERSATION.ACTIONS.LABELS.ADD')}
          </Animated.Text>
        </Pressable>
      </Animated.View>
      <BottomSheetModal
        ref={addLabelSheetRef}
        {...sheetDefaults}
        snapPoints={[400, '75%']}
        index={1}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore">
        <LabelPicker selectedLabels={selectedLabels} onToggleLabel={handleAddOrUpdateLabels} />
      </BottomSheetModal>
    </Animated.View>
  );
};
