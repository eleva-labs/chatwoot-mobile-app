import React from 'react';
import { Trash2 } from 'lucide-react-native';
import { Message } from '@domain/types';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectConversationById } from '@application/store/conversation/conversationSelectors';
import { useChatWindowContext } from '@infrastructure/context';
// import { setQuoteMessage } from '@application/store/conversation/sendMessageSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { useHaptic } from '@infrastructure/utils';
// import { inboxHasFeature, is360DialogWhatsAppChannel, useHaptic } from '@infrastructure/utils';
// import { INBOX_FEATURES } from '@domain/constants';
import { showToast } from '@infrastructure/utils/toastUtils';
import i18n from '@infrastructure/i18n';
import Clipboard from '@react-native-clipboard/clipboard';
import { MESSAGE_TYPES } from '@domain/constants';
import { CopyIcon } from '@/svg-icons';
import { MenuOption } from '../message-menu';
import { MessageItem } from './MessageItem';

type MessageItemContainerProps = {
  item: { date: string } | Message;
  index: number;
};

export const MessageItemContainer = (props: MessageItemContainerProps) => {
  const dispatch = useAppDispatch();
  const { conversationId } = useChatWindowContext();

  const hapticSelection = useHaptic();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));

  // const handleQuoteReplyAttachment = () => {
  //   dispatch(setQuoteMessage(props.item as Message));
  // };

  const handleCopyMessage = (content: string) => {
    hapticSelection?.();
    if (content) {
      Clipboard.setString(content);
      showToast({ message: i18n.t('CONVERSATION.COPY_MESSAGE') });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    await dispatch(conversationActions.deleteMessage({ conversationId, messageId }));
    showToast({ message: i18n.t('CONVERSATION.DELETE_MESSAGE_SUCCESS') });
  };

  // const inboxSupportsReplyTo = (channel: string) => {
  //   const incoming = inboxHasFeature(INBOX_FEATURES.REPLY_TO, channel);
  //   const outgoing =
  //     inboxHasFeature(INBOX_FEATURES.REPLY_TO_OUTGOING, channel) &&
  //     !is360DialogWhatsAppChannel(channel);

  //   return { incoming, outgoing };
  // };

  const getMenuOptions = (message: Message): MenuOption[] => {
    const { messageType, content, attachments } = message;
    // const { private: isPrivate } = message;
    const hasText = !!content;
    const hasAttachments = !!(attachments && attachments.length > 0);
    // const channel = conversation?.meta?.channel;

    const isDeleted = message.contentAttributes?.deleted;

    const menuOptions: MenuOption[] = [];
    if (messageType === MESSAGE_TYPES.ACTIVITY || isDeleted) {
      return [];
    }

    if (hasText) {
      menuOptions.push({
        title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.COPY'),
        icon: <CopyIcon />,
        handleOnPressMenuOption: () => handleCopyMessage(content),
        destructive: false,
      });
    }

    // TODO: Add reply to message when we have the feature
    // if (!isPrivate && channel && inboxSupportsReplyTo(channel).outgoing) {
    //   menuOptions.push({
    //     title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.REPLY'),
    //     icon: null,
    //     handleOnPressMenuOption: handleQuoteReplyAttachment,
    //     destructive: false,
    //   });
    // }

    if (hasAttachments || hasText) {
      menuOptions.push({
        title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.DELETE_MESSAGE'),
        icon: <Trash2 size={20} color={'#E13D45'} />,
        handleOnPressMenuOption: () => handleDeleteMessage(message.id),
        destructive: true,
      });
    }

    return menuOptions;
  };

  return (
    <MessageItem
      item={props.item}
      channel={conversation?.channel || conversation?.meta?.channel}
      getMenuOptions={getMenuOptions}
    />
  );
};
