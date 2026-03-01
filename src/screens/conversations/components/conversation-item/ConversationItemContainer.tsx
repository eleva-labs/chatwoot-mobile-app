/* eslint-disable react/display-name */
import React, { memo, useCallback, useMemo } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useRefsContext } from '@infrastructure/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Conversation } from '@domain/types';
import {
  toggleSelection,
  selectSelected,
  selectSingleConversation,
  clearSelection,
} from '@application/store/conversation/conversationSelectedSlice';
import {
  selectCurrentState,
  setCurrentState,
} from '@application/store/conversation/conversationHeaderSlice';
import { setActionState } from '@application/store/conversation/conversationActionSlice';
import { selectInboxById } from '@application/store/inbox/inboxSelectors';
import { selectContactById } from '@application/store/contact/contactSelectors';
import { selectTypingUsersByConversationId } from '@application/store/conversation/conversationTypingSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { selectAllLabels } from '@application/store/label/labelSelectors';

import { isContactTyping, getLastMessage, getTypingUsersText } from '@infrastructure/utils';
import { Icon, Swipeable } from '@infrastructure/ui/common';

import { ConversationItem } from './ConversationItem';
import { MarkAsUnRead, StatusIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { MarkAsRead } from '@/svg-icons';
import i18n from '@infrastructure/i18n';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

type ConversationItemContainerProps = {
  conversationItem: Conversation;
  index: number;
  openedRowIndex: SharedValue<number | null>;
};

const ReadComponent = React.memo(() => {
  return (
    <Animated.View style={tailwind.style('flex justify-center items-center')}>
      <Icon icon={<MarkAsRead />} size={24} />
    </Animated.View>
  );
});

const UnreadComponent = React.memo(() => {
  return (
    <Animated.View style={tailwind.style('flex justify-center items-center')}>
      <Icon icon={<MarkAsUnRead />} size={24} />
    </Animated.View>
  );
});

const StatusComponent = React.memo(() => {
  return (
    <Animated.View style={tailwind.style('flex justify-center items-center ')}>
      <Icon icon={<StatusIcon />} size={24} />
      <Animated.Text style={tailwind.style('text-sm font-inter-420-20 pt-[3px] text-white')}>
        {i18n.t('CONVERSATION.ITEM.STATUS')}
      </Animated.Text>
    </Animated.View>
  );
});

export const ConversationItemContainer = memo((props: ConversationItemContainerProps) => {
  const { conversationItem, index, openedRowIndex } = props;
  const {
    meta: {
      sender: { name: senderName, thumbnail: senderThumbnail, id: contactId },
      assignee,
    },
    id,
    priority,
    unreadCount,
    labels,
    timestamp,
    createdAt,
    inboxId,
    lastNonActivityMessage,
    slaPolicyId,
    appliedSla,
    firstReplyCreatedAt,
    waitingSince,
    status,
    additionalAttributes,
  } = conversationItem;

  // Hooks
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { actionsModalSheetRef } = useRefsContext();

  // Selectors
  const allLabels = useAppSelector(selectAllLabels);
  const contact = useAppSelector(state => selectContactById(state, contactId));
  const inbox = useAppSelector(state => selectInboxById(state, inboxId));
  const typingUsers = useAppSelector(selectTypingUsersByConversationId(id));
  const selected = useAppSelector(selectSelected);
  const currentState = useAppSelector(selectCurrentState);

  const { availabilityStatus, name: contactName, thumbnail: contactThumbnail } = contact || {};
  const isSelected = useMemo(() => id in selected, [selected, id]);
  const isTyping = useMemo(() => isContactTyping(typingUsers, contactId), [typingUsers, contactId]);
  const typingText = useMemo(() => getTypingUsersText({ users: typingUsers }), [typingUsers]);
  // Read AI status from conversation's custom_attributes (aligned with web logic)
  const isAIEnabled = useMemo(
    () => conversationItem.customAttributes?.aiEnabled === 'true',
    [conversationItem.customAttributes],
  );

  const lastMessage = getLastMessage(conversationItem);

  const markMessageReadOrUnread = useCallback(() => {
    if (unreadCount > 0) {
      dispatch(conversationActions.markMessageRead({ conversationId: id }));
      AnalyticsHelper.track(CONVERSATION_EVENTS.MARK_AS_READ, { conversationId: id });
    } else {
      dispatch(conversationActions.markMessagesUnread({ conversationId: id }));
      AnalyticsHelper.track(CONVERSATION_EVENTS.MARK_AS_UNREAD, { conversationId: id });
    }
  }, [dispatch, id, unreadCount]);

  const onStatusAction = useCallback(() => {
    dispatch(selectSingleConversation(conversationItem));
    dispatch(setActionState('Status'));
    actionsModalSheetRef.current?.present();
  }, [dispatch, conversationItem, actionsModalSheetRef]);

  const onLongPressAction = useCallback(() => {
    dispatch(clearSelection());
    dispatch(setCurrentState('Select'));
  }, [dispatch]);

  const onPressAction = useCallback(() => {
    if (currentState === 'Select') {
      dispatch(toggleSelection({ conversation: conversationItem }));
    } else {
      const pushToChatScreen = StackActions.push('ChatScreen', {
        conversationId: id,
        isConversationOpenedExternally: false,
      });
      navigation.dispatch(pushToChatScreen);
    }
  }, [currentState, dispatch, conversationItem, navigation, id]);

  const viewProps = {
    id,
    senderName: contactName || senderName,
    senderThumbnail: contactThumbnail || senderThumbnail,
    isSelected,
    currentState,
    unreadCount,
    isTyping,
    availabilityStatus: availabilityStatus || 'offline',
    priority,
    labels,
    timestamp,
    createdAt,
    inbox: inbox || null,
    lastNonActivityMessage,
    lastMessage,
    inboxId,
    assignee: assignee || null,
    slaPolicyId,
    appliedSla: appliedSla || null,
    appliedSlaConversationDetails: {
      firstReplyCreatedAt,
      waitingSince,
      status,
    },
    additionalAttributes,
    allLabels,
    typingText: typingText as string | undefined,
    isAIEnabled,
    contactId,
  };

  return (
    <Swipeable
      spacing={27}
      leftElement={unreadCount > 0 ? <ReadComponent /> : <UnreadComponent />}
      rightElement={<StatusComponent />}
      handleLeftElementPress={markMessageReadOrUnread}
      handleOnLeftOverswiped={markMessageReadOrUnread}
      handleRightElementPress={onStatusAction}
      handleOnRightOverswiped={onStatusAction}
      handleLongPress={onLongPressAction}
      handlePress={onPressAction}
      triggerOverswipeOnFlick
      {...{ index, openedRowIndex }}>
      <ConversationItem {...viewProps} />
    </Swipeable>
  );
});
