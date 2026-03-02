import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { CaretRight } from '@/svg-icons/common/CaretRight';
import { Icon } from '@infrastructure/ui';
import { PriorityIcon, NoPriorityIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { ConversationPriority } from '@domain/types';
import i18n from '@infrastructure/i18n';

type PriorityPanelProps = {
  priority: ConversationPriority;
  onPress: () => void;
};

const priorityAvatar = (priority: ConversationPriority) => {
  if (priority) {
    return <Icon icon={<PriorityIcon />} />;
  }
  return <Icon icon={<NoPriorityIcon />} />;
};

const PriorityPanel = ({ priority, onPress }: PriorityPanelProps) => {
  const priorityName = priority
    ? i18n.t(`CONVERSATION.PRIORITY.OPTIONS.${priority.toUpperCase()}`)
    : i18n.t('CONVERSATION.ACTIONS.PRIORITY.EMPTY');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [tailwind.style(pressed ? 'bg-slate-3' : '', 'rounded-t-[13px]')]}>
      <Animated.View style={tailwind.style('flex-row items-center justify-between pl-3')}>
        {priorityAvatar(priority)}
        <Animated.View
          style={tailwind.style(
            'flex-1 flex-row items-center justify-between py-[11px] ml-[10px] border-b-[1px] border-b-slate-6',
          )}>
          <Animated.Text
            style={tailwind.style(
              'text-base font-inter-420-20 leading-[22.4px] tracking-[0.16px] text-slate-12 capitalize',
            )}>
            {priorityName}
          </Animated.Text>
          <Animated.View style={tailwind.style('flex-row items-center pr-3')}>
            <Animated.Text
              style={tailwind.style(
                'text-base font-inter-normal-20 leading-[22px] tracking-[0.16px] text-slate-12',
              )}>
              {i18n.t('CONVERSATION.ACTIONS.PRIORITY.EDIT')}
            </Animated.Text>
            <CaretRight size={20} color={tailwind.color('text-slate-12') ?? '#202020'} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export default PriorityPanel;
