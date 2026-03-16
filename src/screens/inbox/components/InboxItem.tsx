import React from 'react';
import Animated from 'react-native-reanimated';
import { Avatar } from '@infrastructure/ui';
import { tailwind, textBodySmallBook } from '@infrastructure/theme';
import type { NotificationType } from '@domain/types/Notification';
import { ConversationPriority } from '@domain/types/common';
import { AnimatedNativeView, NativeView } from '@infrastructure/ui/native-components';
import { PriorityIndicator, ChannelIndicator } from '@infrastructure/ui/list-components';

import { Inbox } from '@domain/types/Inbox';
import { ConversationAdditionalAttributes } from '@domain/types/Conversation';
import { NotificationTypeIndicator } from './NotificationTypeIndicator';
import { Dimensions } from 'react-native';

type InboxItemProps = {
  isRead: boolean;
  conversationId: number;
  sender: {
    name: string;
    thumbnail: string;
  };
  assignee: {
    name: string;
    thumbnail: string;
  };
  lastActivityAt: () => string;
  priority?: ConversationPriority | null;
  inbox: Inbox | null;
  additionalAttributes: ConversationAdditionalAttributes;
  pushMessageTitle: string;
  notificationType: NotificationType;
};

const { width } = Dimensions.get('screen');

export const InboxItemComponent = (props: InboxItemProps) => {
  const {
    isRead,
    inbox,
    assignee,
    conversationId,
    sender,
    lastActivityAt,
    priority,
    additionalAttributes,
    pushMessageTitle,
    notificationType,
  } = props;

  const hasAssignee = assignee?.name || assignee?.thumbnail;

  return (
    <Animated.View style={tailwind.style('ml-3 py-3 pr-4 border-b-[1px] border-b-slate-6')}>
      <Animated.View style={tailwind.style('')}>
        <AnimatedNativeView
          style={tailwind.style('flex flex-row justify-between items-center h-[24px]')}>
          <AnimatedNativeView
            style={tailwind.style('flex flex-row items-center h-[24px] gap-[5px]')}>
            <Animated.Text
              numberOfLines={1}
              style={tailwind.style(
                'text-base font-inter-medium-24 tracking-[0.24px] text-slate-12 capitalize',
                `max-w-[${width - 250}px]`,
              )}>
              {sender.name || ''}
            </Animated.Text>
            <NativeView style={tailwind.style('flex flex-row items-center gap-0.5')}>
              <Animated.Text style={tailwind.style(`${textBodySmallBook} text-slate-11`)}>
                #
              </Animated.Text>
              <Animated.Text style={tailwind.style(`${textBodySmallBook} text-slate-11`)}>
                {conversationId}
              </Animated.Text>
            </NativeView>
          </AnimatedNativeView>
          <AnimatedNativeView style={tailwind.style('flex flex-row items-center gap-2')}>
            {priority ? <PriorityIndicator {...{ priority }} /> : null}
            {inbox && (
              <ChannelIndicator inbox={inbox} additionalAttributes={additionalAttributes} />
            )}
            <NativeView>
              <Animated.Text
                style={tailwind.style(
                  `${textBodySmallBook} leading-[16px] tracking-[0.32px] text-slate-11`,
                )}>
                {lastActivityAt()}
              </Animated.Text>
            </NativeView>
          </AnimatedNativeView>
        </AnimatedNativeView>

        <Animated.View style={tailwind.style('flex flex-row justify-between mt-1.5')}>
          <Animated.View style={tailwind.style('flex flex-row items-center gap-1.5 flex-1')}>
            {hasAssignee && (
              <Avatar
                src={assignee.thumbnail ? { uri: assignee.thumbnail } : undefined}
                size="md"
                name={assignee?.name || ''}
              />
            )}

            <Animated.Text
              style={tailwind.style(
                'font-inter-420-20 text-md text-slate-12 leading-[17px] tracking-[0.32px] flex-shrink',
              )}
              numberOfLines={1}
              ellipsizeMode="tail">
              {pushMessageTitle}
            </Animated.Text>
          </Animated.View>
          <NotificationTypeIndicator type={notificationType} />
        </Animated.View>
      </Animated.View>
      {isRead && (
        <Animated.View style={tailwind.style('absolute bg-solid-1 opacity-50 inset-0 z-20')} />
      )}
    </Animated.View>
  );
};

InboxItemComponent.displayName = 'InboxItem';
export const InboxItem = React.memo(InboxItemComponent);
