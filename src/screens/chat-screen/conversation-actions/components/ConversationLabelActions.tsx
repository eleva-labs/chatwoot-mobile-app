import React, { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useChatWindowContext, useRefsContext } from '@infrastructure/context';
import { LabelTag } from '@/svg-icons';
import { tailwind, useBoxShadow } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { Label } from '@domain/types';
import { BottomSheetBackdrop, Icon, SearchBar } from '@infrastructure/ui';
import { useBottomSheetInset } from '@infrastructure/utils';
import i18n from '@infrastructure/i18n';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { filterLabels } from '@application/store/label/labelSelectors';
import { conversationActions } from '@application/store/conversation/conversationActions';

import { LabelCell, LabelItemRemovable } from '@infrastructure/ui/label-section';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { LABEL_EVENTS } from '@domain/constants/analyticsEvents';

type LabelStackProps = {
  filteredLabels: Label[];
  selectedLabels: string[];
  handleLabelPress: (label: string) => void;
  isStandAloneComponent?: boolean;
};
const LabelStack = (props: LabelStackProps) => {
  const { filteredLabels, selectedLabels, isStandAloneComponent = true, handleLabelPress } = props;

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false} style={tailwind.style('my-1 pl-3')}>
      {filteredLabels.map((value, index) => {
        return (
          <LabelCell
            key={index}
            {...{ value, index }}
            handleLabelPress={handleLabelPress}
            isActive={selectedLabels.includes(value.title)}
            isLastItem={index === filteredLabels.length - 1 && isStandAloneComponent ? true : false}
          />
        );
      })}
    </BottomSheetScrollView>
  );
};

interface LabelSectionProps {
  labels: string[];
}

export const ConversationLabelActions = (props: LabelSectionProps) => {
  const { labels } = props;
  const themedTailwind = useThemedStyles();
  const bottomSheetInset = useBottomSheetInset();
  const [searchTerm, setSearchTerm] = useState('');
  const { conversationId } = useChatWindowContext();
  const dispatch = useAppDispatch();
  const cardShadow = useBoxShadow('card');

  const [selectedLabels, setSelectedLabels] = useState(labels);

  const { addLabelSheetRef } = useRefsContext();

  const allLabels = useAppSelector(state => filterLabels(state, ''));

  const filteredLabels = useAppSelector(state => filterLabels(state, searchTerm));

  const conversationLabels =
    allLabels && selectedLabels
      ? allLabels.filter(({ title }) => {
          return selectedLabels?.includes(title);
        })
      : [];

  const handleAddLabelPress = () => {
    addLabelSheetRef.current?.present();
  };

  const handleOnSubmitEditing = () => {
    addLabelSheetRef.current?.close();
  };

  const handleChangeText = (text: string) => {
    setSearchTerm(text);
  };

  const handleChange = (index: number) => {
    if (index === -1) {
      setSearchTerm('');
    }
  };

  const handleAddOrUpdateLabels = async (label: string) => {
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
  };
  return (
    <Animated.View>
      <Animated.View style={tailwind.style('pl-4')}>
        <Animated.Text
          style={tailwind.style(
            'text-sm font-inter-medium-24 leading-[16px] tracking-[0.32px] text-slate-11',
          )}>
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
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        backgroundStyle={themedTailwind.style('bg-solid-1')}
        enablePanDownToClose
        bottomInset={bottomSheetInset}
        snapPoints={[400, '75%']}
        index={1}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onChange={handleChange}>
        <SearchBar
          isInsideBottomSheet
          onSubmitEditing={handleOnSubmitEditing}
          onChangeText={handleChangeText}
          placeholder={i18n.t('CONVERSATION.LABELS.SEARCH_PLACEHOLDER')}
          returnKeyLabel="done"
          returnKeyType="done"
        />
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <LabelStack
            filteredLabels={filteredLabels}
            selectedLabels={selectedLabels}
            isStandAloneComponent={allLabels.length > 3}
            handleLabelPress={handleAddOrUpdateLabels}
          />
          <Animated.View style={tailwind.style('items-start')}></Animated.View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </Animated.View>
  );
};
