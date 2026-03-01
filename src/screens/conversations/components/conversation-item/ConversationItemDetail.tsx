/* eslint-disable react/display-name */
import React, { memo, useState } from 'react';
import { Dimensions, ImageURISource, Text } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { isEqual } from 'lodash';

import { Avatar } from '@/components-next/common';
import { AnimatedNativeView, NativeView } from '@/components-next/native-components';
import { AIStatusIcon } from '@/components-next';
import { tailwind } from '@/theme';
import { Agent, Conversation, ConversationAdditionalAttributes, Label, Message } from '@/types';
import { useThemedStyles } from '@/hooks';

import { ConversationLastMessage } from './ConversationLastMessage';
import { PriorityIndicator, ChannelIndicator } from '@/components-next/list-components';
import { SLAIndicator } from './SLAIndicator';
import { LabelIndicator } from './LabelIndicator';
import { LastActivityTime } from './LastActivityTime';
import { SLA } from '@/types/common/SLA';
import { Inbox } from '@/types/Inbox';
import { TypingMessage } from './TypingMessage';

const { width } = Dimensions.get('screen');

type ConversationDetailSubCellProps = Pick<
  Conversation,
  'id' | 'priority' | 'labels' | 'unreadCount' | 'inboxId' | 'slaPolicyId'
> & {
  senderName: string | null;
  assignee: Agent | null;
  timestamp: number;
  lastMessage?: Message | null;
  inbox: Inbox | null;
  appliedSla: SLA | null;
  appliedSlaConversationDetails?:
    | {
        firstReplyCreatedAt: number;
        waitingSince: number;
        status: string;
      }
    | Record<string, never>;
  additionalAttributes?: ConversationAdditionalAttributes;
  allLabels: Label[];
  typingText?: string;
  isAIEnabled?: boolean;
  contactId?: number;
};

const checkIfPropsAreSame = (
  prev: ConversationDetailSubCellProps,
  next: ConversationDetailSubCellProps,
) => {
  const arePropsEqual = isEqual(prev, next);
  return arePropsEqual;
};

const UnreadBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <NativeView
      style={tailwind.style(
        'h-4 min-w-[16px] px-1 flex justify-center items-center rounded-full bg-teal-9',
      )}>
      <Text
        style={tailwind.style(
          'text-xxs font-inter-semibold-20 leading-none text-center text-white',
        )}>
        {count > 9 ? '9+' : count}
      </Text>
    </NativeView>
  );
};

export const ConversationItemDetail = memo((props: ConversationDetailSubCellProps) => {
  const {
    priority,
    labels,
    assignee,
    senderName,
    timestamp,
    slaPolicyId,
    lastMessage,
    inbox,
    appliedSla,
    appliedSlaConversationDetails,
    additionalAttributes,
    allLabels,
    typingText,
    isAIEnabled,
    unreadCount,
  } = props;

  const [shouldShowSLA, setShouldShowSLA] = useState(true);

  const themedTailwind = useThemedStyles();

  const hasPriority = priority !== null;

  const hasLabels = labels.length > 0;

  const hasSLA = !!slaPolicyId && shouldShowSLA;

  const hasUnread = (unreadCount ?? 0) > 0;

  if (!lastMessage) {
    return null;
  }

  return (
    <AnimatedNativeView
      layout={LinearTransition.springify().damping(28).stiffness(200)}
      style={themedTailwind.style('flex-1 gap-0.5 py-3 border-b border-b-slate-3')}>
      <AnimatedNativeView style={tailwind.style('flex flex-row justify-between items-end h-7')}>
        <AnimatedNativeView style={tailwind.style('flex flex-row items-end h-7 gap-1')}>
          <Text
            numberOfLines={1}
            style={themedTailwind.style(
              `text-sm ${hasUnread ? 'font-inter-semibold-20' : 'font-inter-medium-24'} text-slate-12 capitalize`,
              // Calculated based on the widths of other content,
              // We might have to do a 10-20px offset based on the max width of the timestamp
              `max-w-[${width - 250}px]`,
            )}>
            {senderName}
          </Text>
          {/* <ConversationId id={conversationId} /> */}
          {assignee ? (
            <Avatar
              size="sm"
              name={assignee.name as string}
              src={{ uri: assignee.thumbnail } as ImageURISource}
            />
          ) : null}
        </AnimatedNativeView>
        <AnimatedNativeView style={tailwind.style('flex flex-col items-end')}>
          <AnimatedNativeView style={tailwind.style('flex flex-row items-center gap-2')}>
            {hasPriority ? <PriorityIndicator {...{ priority }} /> : null}
            {inbox && (
              <ChannelIndicator inbox={inbox} additionalAttributes={additionalAttributes} />
            )}
            <LastActivityTime timestamp={timestamp} />
          </AnimatedNativeView>
          <AnimatedNativeView style={tailwind.style('flex flex-row items-center gap-1 mt-0.5')}>
            <AIStatusIcon isEnabled={isAIEnabled ?? false} size={16} />
            <UnreadBadge count={unreadCount ?? 0} />
          </AnimatedNativeView>
        </AnimatedNativeView>
      </AnimatedNativeView>
      {hasLabels || hasSLA ? (
        <AnimatedNativeView style={tailwind.style('flex flex-col items-center gap-1')}>
          <AnimatedNativeView
            style={tailwind.style('flex flex-row w-full justify-between items-center gap-2')}>
            {typingText ? (
              <TypingMessage typingText={typingText} />
            ) : (
              <ConversationLastMessage
                numberOfLines={1}
                lastMessage={lastMessage as Message}
                hasUnread={hasUnread}
              />
            )}
          </AnimatedNativeView>
          <AnimatedNativeView
            style={tailwind.style('flex flex-row h-6 justify-between items-center gap-2')}>
            <AnimatedNativeView style={tailwind.style('flex flex-row flex-1 gap-2 items-center')}>
              {hasSLA && (
                <SLAIndicator
                  slaPolicyId={slaPolicyId}
                  appliedSla={appliedSla as SLA}
                  appliedSlaConversationDetails={
                    appliedSlaConversationDetails as {
                      firstReplyCreatedAt: number;
                      waitingSince: number;
                      status: string;
                    }
                  }
                  onSLAStatusChange={setShouldShowSLA}
                />
              )}
              {hasLabels && hasSLA && (
                <NativeView style={tailwind.style('w-[1px] h-3 bg-slate-5')} />
              )}
              {hasLabels && <LabelIndicator labels={labels} allLabels={allLabels} />}
            </AnimatedNativeView>

            {assignee ? (
              <AnimatedNativeView>
                <Avatar
                  size="sm"
                  name={assignee.name as string}
                  src={{ uri: assignee.thumbnail } as ImageURISource}
                />
              </AnimatedNativeView>
            ) : null}
          </AnimatedNativeView>
        </AnimatedNativeView>
      ) : (
        <AnimatedNativeView style={tailwind.style('flex flex-row items-center gap-2')}>
          {typingText ? (
            <TypingMessage typingText={typingText} />
          ) : (
            <ConversationLastMessage
              numberOfLines={1}
              lastMessage={lastMessage as Message}
              hasUnread={hasUnread}
            />
          )}
        </AnimatedNativeView>
      )}
    </AnimatedNativeView>
  );
}, checkIfPropsAreSame);
