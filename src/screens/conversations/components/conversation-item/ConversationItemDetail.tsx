/* eslint-disable react/display-name */
import React, { memo, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { isEqual } from 'lodash';

import { AnimatedNativeView, NativeView } from '@infrastructure/ui/native-components';
import { AIStatusIcon } from '@infrastructure/ui';
import { tailwind } from '@infrastructure/theme';
import {
  Agent,
  Conversation,
  ConversationAdditionalAttributes,
  Label,
  Message,
} from '@domain/types';
import { useThemedStyles } from '@infrastructure/hooks';
import { PersonIcon } from '@/svg-icons';

import { ConversationLastMessage } from './ConversationLastMessage';
import { PriorityIndicator, InboxIndicator } from '@infrastructure/ui/list-components';
import { SLAIndicator } from './SLAIndicator';
import { LabelIndicator } from './LabelIndicator';
import { LastActivityTime } from './LastActivityTime';
import { SLA } from '@domain/types/common/SLA';
import { Inbox } from '@domain/types/Inbox';
import { TypingMessage } from './TypingMessage';

const { width } = Dimensions.get('screen');

type ConversationDetailSubCellProps = Pick<
  Conversation,
  'id' | 'priority' | 'labels' | 'unreadCount' | 'inboxId' | 'slaPolicyId'
> & {
  senderName: string | null;
  assignee: Agent | null;
  timestamp: number;
  createdAt?: number;
  lastMessage?: Message | null;
  inbox: Inbox | null;
  showInboxIndicator?: boolean;
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
        'h-5 min-w-[20px] px-1 flex justify-center items-center rounded-full bg-teal-9',
      )}>
      <Text
        style={tailwind.style('text-sm font-inter-semibold-20 leading-5 text-center text-white')}>
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
    createdAt,
    slaPolicyId,
    lastMessage,
    inbox,
    showInboxIndicator = false,
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

  const hasInboxIndicator = showInboxIndicator && !!inbox;

  const hasUnread = (unreadCount ?? 0) > 0;

  if (!lastMessage) {
    return null;
  }

  return (
    <AnimatedNativeView
      layout={LinearTransition.springify().damping(28).stiffness(200)}
      style={themedTailwind.style('flex-1 py-3 border-b border-b-slate-3')}>
      {/* Row 1: Contact name + assignee | Timestamp */}
      <AnimatedNativeView style={tailwind.style('flex flex-row justify-between items-center')}>
        <AnimatedNativeView
          style={tailwind.style('flex flex-row items-center flex-1 min-w-0 pr-16')}>
          <Text
            numberOfLines={1}
            style={themedTailwind.style(
              `text-sm ${hasUnread ? 'font-inter-semibold-20' : 'font-inter-medium-24'} text-slate-12 capitalize`,
              `max-w-[${width - (assignee ? 300 : 250)}px]`,
            )}>
            {senderName}
          </Text>
          {hasPriority ? (
            <NativeView style={tailwind.style('ml-1')}>
              <PriorityIndicator priority={priority!} />
            </NativeView>
          ) : null}
          {assignee ? (
            <NativeView
              style={tailwind.style('flex flex-row items-center flex-shrink min-w-0 ml-1')}>
              <Text style={themedTailwind.style('text-xs text-slate-10 mx-1')}>·</Text>
              <PersonIcon color={themedTailwind.style('text-slate-10').color as string} />
              <Text
                numberOfLines={1}
                style={themedTailwind.style('text-xs font-inter-normal-28 text-slate-10 ml-0.5')}>
                {assignee.name}
              </Text>
            </NativeView>
          ) : null}
        </AnimatedNativeView>
        <AnimatedNativeView
          style={tailwind.style('absolute right-0 flex flex-row items-center gap-1')}>
          <LastActivityTime timestamp={timestamp} createdAt={createdAt} />
        </AnimatedNativeView>
      </AnimatedNativeView>
      {/* Row 2: Last message | AI icon + Unread badge */}
      <AnimatedNativeView
        style={tailwind.style('flex flex-row justify-between items-center mt-0.5')}>
        <AnimatedNativeView style={tailwind.style('flex-1 min-w-0 pr-16')}>
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
          style={tailwind.style('absolute right-0 flex flex-row items-center gap-1')}>
          <NativeView style={tailwind.style('w-3 items-center justify-center')}>
            <AIStatusIcon isEnabled={isAIEnabled ?? false} size={12} />
          </NativeView>
          <UnreadBadge count={unreadCount ?? 0} />
        </AnimatedNativeView>
      </AnimatedNativeView>
      {/* Row 3: Inbox indicator + SLA + Labels (if any) */}
      {(hasInboxIndicator || hasLabels || hasSLA) && (
        <AnimatedNativeView style={tailwind.style('flex flex-row items-center mt-0.5')}>
          <AnimatedNativeView style={tailwind.style('flex flex-row flex-1 gap-1 items-center')}>
            {hasInboxIndicator && (
              <InboxIndicator
                inbox={inbox!}
                additionalAttributes={additionalAttributes}
                size="sm"
              />
            )}
            {hasInboxIndicator && (hasSLA || hasLabels) && (
              <NativeView style={tailwind.style('w-[1px] h-3 bg-slate-5')} />
            )}
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
            {hasLabels && hasSLA && <NativeView style={tailwind.style('w-[1px] h-3 bg-slate-5')} />}
            {hasLabels && <LabelIndicator labels={labels} allLabels={allLabels} />}
          </AnimatedNativeView>
        </AnimatedNativeView>
      )}
    </AnimatedNativeView>
  );
}, checkIfPropsAreSame);
