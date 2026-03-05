import React, { useEffect } from 'react';
import { Dimensions, Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Icon } from '@infrastructure/ui';
import { OpenIcon, ResolvedFilledIcon, PendingFilledIcon, SnoozedFilledIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { useHaptic, useScaleAnimation } from '@infrastructure/utils';
import { ConversationStatus } from '@domain/types';
import i18n from '@infrastructure/i18n';

import { ConversationActionType } from '../ConversationActions';

type ConversationStateType = 'open' | 'pending' | 'snooze' | 'resolve';

type ConversationActionOptionsType = {
  backgroundActionColor: string;
  backgroundActionPressedColor: string;
  borderActionColor: string;
  actionIcon: React.JSX.Element;
  actionText: ConversationStateType;
  actionI18nKey: string;
  actionStatus: ConversationStatus | 'open';
};

const SCREEN_WIDTH = Dimensions.get('screen').width;
const ACTION_WIDTH = (SCREEN_WIDTH - 32 - 12 * 3) / 4;

const conversationActionOptions: ConversationActionOptionsType[] = [
  {
    backgroundActionColor: 'bg-slate-3',
    backgroundActionPressedColor: 'bg-slate-4',
    borderActionColor: 'bg-slate-11',
    actionIcon: <OpenIcon stroke={tailwind.color('text-slate-11') as string} />,
    actionText: 'open',
    actionI18nKey: 'CONVERSATION.ACTIONS.BASIC.OPEN',
    actionStatus: 'open',
  },
  {
    backgroundActionColor: 'bg-amber-3',
    backgroundActionPressedColor: 'bg-amber-4',
    borderActionColor: 'bg-amber-9',
    actionIcon: <PendingFilledIcon />,
    actionText: 'pending',
    actionI18nKey: 'CONVERSATION.ACTIONS.BASIC.PENDING',
    actionStatus: 'pending',
  },
  {
    backgroundActionColor: 'bg-iris-3',
    backgroundActionPressedColor: 'bg-iris-4',
    borderActionColor: 'bg-iris-9',
    actionIcon: <SnoozedFilledIcon />,
    actionText: 'snooze',
    actionI18nKey: 'CONVERSATION.ACTIONS.BASIC.SNOOZE',
    actionStatus: 'snoozed',
  },
  {
    backgroundActionColor: 'bg-teal-3',
    backgroundActionPressedColor: 'bg-teal-4',
    borderActionColor: 'bg-teal-9',
    actionIcon: <ResolvedFilledIcon />,
    actionText: 'resolve',
    actionI18nKey: 'CONVERSATION.ACTIONS.BASIC.RESOLVE',
    actionStatus: 'resolved',
  },
];

type ConversationActionOptionProps = {
  index: number;
  conversationAction: ConversationActionOptionsType;
  status: ConversationStatus | undefined;
  isMuted: boolean | false;
  updateConversationStatus: (type: ConversationActionType, status?: ConversationStatus) => void;
};

const ConversationActionOption = (props: ConversationActionOptionProps) => {
  const { index, conversationAction, status, updateConversationStatus, isMuted } = props;

  const hapticSelection = useHaptic();

  const handleActionOptionPress = () => {
    hapticSelection?.();
    updateConversationStatus('status', conversationAction.actionStatus as ConversationStatus);
  };
  const actionActive = useSharedValue(0);

  const { handlers, animatedStyle } = useScaleAnimation();

  useEffect(() => {
    if (conversationAction.actionStatus === status) {
      actionActive.value = withSpring(1);
    } else {
      actionActive.value = withSpring(0);
    }
  }, [
    actionActive,
    conversationAction.actionStatus,
    conversationAction.actionText,
    status,
    isMuted,
  ]);

  const actionBorderColor = tailwind.color(conversationAction.borderActionColor) as string;

  const activeActionContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(actionActive.value, [0, 1], ['transparent', actionBorderColor]),
    };
  });

  return (
    <Animated.View
      style={[
        tailwind.style('flex-1', index !== conversationActionOptions.length - 1 ? 'mr-3' : ''),
        animatedStyle,
      ]}>
      <Pressable
        key={index}
        style={({ pressed }) => [
          tailwind.style(
            'flex items-center justify-between rounded-xl pt-7 pb-3',
            `w-[${ACTION_WIDTH}px]`,
            conversationAction.backgroundActionColor,
            pressed ? conversationAction.backgroundActionPressedColor : '',
          ),
        ]}
        onPress={handleActionOptionPress}
        {...handlers}>
        <Animated.View
          style={[
            tailwind.style('absolute inset-0 border-2 rounded-xl'),
            activeActionContainerStyle,
          ]}
        />
        <Icon icon={conversationAction.actionIcon} size={32} />
        <Animated.Text
          style={tailwind.style(
            'text-md font-inter-normal-20 leading-[17px] tracking-[0.32px] text-center pt-5 text-slate-12 ',
          )}>
          {i18n.t(conversationAction.actionI18nKey)}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
};

type ConversationBasicActionsProps = {
  status: ConversationStatus | undefined;
  updateConversationStatus: (type: ConversationActionType, status?: ConversationStatus) => void;
  isMuted: boolean | false;
};

export const ConversationBasicActions = (props: ConversationBasicActionsProps) => {
  const { status, updateConversationStatus, isMuted } = props;

  return (
    <Animated.View style={tailwind.style('flex flex-row justify-around px-4 pt-5')}>
      {conversationActionOptions.map((conversationAction, index) => (
        <ConversationActionOption
          key={index}
          conversationAction={conversationAction}
          status={status}
          isMuted={isMuted}
          updateConversationStatus={updateConversationStatus}
          index={index}
        />
      ))}
    </Animated.View>
  );
};
