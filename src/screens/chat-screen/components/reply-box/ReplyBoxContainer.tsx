import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, TextInput } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, LockOpen } from 'lucide-react-native';

import { useChatWindowContext, useRefsContext } from '@infrastructure/context';
import {
  useHaptic,
  isAWhatsAppChannel,
  isAnEmailChannel,
  isASmsInbox,
  isAFacebookInbox,
  isALineChannel,
  isATelegramChannel,
  isAWebWidgetInbox,
  isAPIInbox,
  isAnInstagramChannel,
  getTypingUsersText,
} from '@infrastructure/utils';
import { useAppDispatch, useAppSelector, useThemedStyles } from '@/hooks';
import { MESSAGE_MAX_LENGTH, REPLY_EDITOR_MODES } from '@domain/constants';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import {
  selectMessageContent,
  selectAttachments,
  selectQuoteMessage,
  resetSentMessage,
  selectIsPrivateMessage,
  togglePrivateMessage,
  setMessageContent,
} from '@application/store/conversation/sendMessageSlice';
import {
  selectUserId,
  selectUserName,
  selectUserThumbnail,
} from '@application/store/auth/authSelectors';
import {
  selectConversationById,
  getLastEmailInSelectedChat,
} from '@application/store/conversation/conversationSelectors';
import { selectInboxById } from '@application/store/inbox/inboxSelectors';
import { conversationActions } from '@application/store/conversation/conversationActions';

import { AddCommandButton } from './buttons/AddCommandButton';
import { SendMessageButton } from './buttons/SendMessageButton';
import { MessageTextInput } from './MessageTextInput';
import { QuoteReply } from './QuoteReply';
import { CannedResponses } from './CannedResponses';
import { AttachedMedia } from '../message-components/AttachedMedia';
import { CommandOptionsMenu } from '../message-components/CommandOptionsMenu';
import { SendMessagePayload } from '@application/store/conversation/conversationTypes';
import { TypingIndicator } from './TypingIndicator';
import { selectTypingUsersByConversationId } from '@application/store/conversation/conversationTypingSlice';
import { Agent, CannedResponse, Conversation } from '@domain/types';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';
import {
  allMessageVariables,
  replaceMessageVariables,
  getAllUndefinedVariablesInMessage,
} from '@infrastructure/utils/messageVariableUtils';
import { ReplyEmailHead } from './ReplyEmailHead';
import { selectAssignableParticipantsByInboxId } from '@application/store/assignable-agent/assignableAgentSelectors';
import { spring } from '@infrastructure/animation';
import { AudioRecorder } from '../audio-recorder/AudioRecorder';
import { VoiceRecordButton } from './buttons/VoiceRecordButton';

// TODO: Implement this
// const globalConfig = {
//   directUploadsEnabled: true,
// };

const AnimatedKeyboardStickyView = Animated.createAnimatedComponent(KeyboardStickyView);
const BottomSheetContent = () => {
  const themedTailwind = useThemedStyles();
  const { colors } = useThemeColors();
  const hapticSelection = useHaptic();
  const dispatch = useAppDispatch();
  const { bottom } = useSafeAreaInsets();
  const { messageListRef } = useRefsContext();
  const isSendingRef = useRef(false);

  // Selectors
  const userId = useAppSelector(selectUserId);
  const userThumbnail = useAppSelector(selectUserThumbnail);
  const userName = useAppSelector(selectUserName);
  const messageContent = useAppSelector(selectMessageContent);
  const attachedFiles = useAppSelector(selectAttachments);
  const quoteMessage = useAppSelector(selectQuoteMessage);
  const isPrivate = useAppSelector(selectIsPrivateMessage);

  // Context
  const {
    isAddMenuOptionSheetOpen,
    setAddMenuOptionSheetState,
    textInputRef,
    isTextInputFocused,
    conversationId,
    isVoiceRecorderOpen,
    setIsVoiceRecorderOpen,
  } = useChatWindowContext();

  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const { inboxId, canReply } = conversation || {};
  const inbox = useAppSelector(state => (inboxId ? selectInboxById(state, inboxId) : undefined));

  const selectAgents = useAppSelector(selectAssignableParticipantsByInboxId);
  const agents = inboxId ? selectAgents(inboxId, '') : [];

  const [replyEditorMode, setReplyEditorMode] = useState(REPLY_EDITOR_MODES.REPLY);
  const [ccEmails, setCCEmails] = useState('');
  const [bccEmails, setBCCEmails] = useState('');
  const [toEmails, setToEmails] = useState('');
  const [selectedCannedResponse, setSelectedCannedResponse] = useState<string | null>(null);

  const typingUsers = useAppSelector(selectTypingUsersByConversationId(conversationId));
  const typingText = useMemo(() => getTypingUsersText({ users: typingUsers }), [typingUsers]);

  const attachmentsLength = useMemo(() => attachedFiles.length, [attachedFiles.length]);

  const shouldShowReplyHeader = inbox && isAnEmailChannel(inbox) && !isPrivate;

  const lastEmail = useAppSelector(state =>
    shouldShowReplyHeader ? getLastEmailInSelectedChat(state, { conversationId }) : null,
  );

  useEffect(() => {
    if (!lastEmail) return;
    const contentAttributes = lastEmail.contentAttributes as
      | Record<string, unknown>
      | null
      | undefined;
    const emailAttributes =
      (contentAttributes?.email as Record<string, string[]> | undefined) ?? {};

    // Retrieve the email of the current conversation's sender
    const conversationContact = conversation?.meta?.sender?.email || '';
    let cc = emailAttributes.cc ? [...emailAttributes.cc] : [];
    let to = [];

    // there might be a situation where the current conversation will include a message from a third person,
    // and the current conversation contact is in CC.
    // This is an edge-case, reported here: CW-1511 [ONLY FOR INTERNAL REFERENCE]
    // So we remove the current conversation contact's email from the CC list if present
    if (cc.includes(conversationContact)) {
      cc = cc.filter(email => email !== conversationContact);
    }

    // If the last incoming message sender is different from the conversation contact, add them to the "to"
    // and add the conversation contact to the CC
    if (!emailAttributes.from.includes(conversationContact)) {
      to.push(...emailAttributes.from);
      cc.push(conversationContact);
    }

    // Remove the conversation contact's email from the BCC list if present
    let bcc = (emailAttributes.bcc || []).filter((email: string) => email !== conversationContact);

    // Ensure only unique email addresses are in the CC list
    bcc = [...new Set(bcc)];
    cc = [...new Set(cc)];
    to = [...new Set(to)];
    setCCEmails(cc.join(', '));
    setBCCEmails(bcc.join(', '));
    setToEmails(to.join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEmail]);

  const messageVariables = allMessageVariables({
    conversation: conversation as Conversation,
  });

  useEffect(() => {
    if (canReply || (inbox && isAWhatsAppChannel(inbox))) {
      setReplyEditorMode(REPLY_EDITOR_MODES.REPLY);
      dispatch(togglePrivateMessage(false));
    } else {
      setReplyEditorMode(REPLY_EDITOR_MODES.NOTE);
      dispatch(togglePrivateMessage(true));
    }
  }, [inbox, canReply, dispatch]);

  const derivedAddMenuOptionStateValue = useDerivedValue(() => {
    return isAddMenuOptionSheetOpen ? withSpring(1, spring.soft) : withSpring(0, spring.soft);
  });

  const animatedInputWrapperStyle = useAnimatedStyle(
    () => ({
      marginBottom: isTextInputFocused ? 0 : bottom,
    }),
    [isTextInputFocused],
  );

  const handleShowAddMenuOption = () => {
    if (isAddMenuOptionSheetOpen) {
      hapticSelection?.();
      setAddMenuOptionSheetState(false);
    } else {
      Keyboard.dismiss();
      hapticSelection?.();
      setAddMenuOptionSheetState(true);
    }
  };

  const handleTogglePrivateMode = () => {
    if (replyEditorMode === REPLY_EDITOR_MODES.REPLY) {
      hapticSelection?.();
      dispatch(togglePrivateMessage(!isPrivate));
    }
  };

  // TODO: Implement this
  const setReplyToInPayload = (messagePayload: SendMessagePayload): SendMessagePayload => {
    //     ...(quoteMessage?.id && {
    //       contentAttributes: { inReplyTo: quoteMessage.id },
    //     }),
    return messagePayload;
  };

  type MobileFileType = { uri: string; fileName: string; type: string };

  const getMessagePayload = (message: string, audioFile: MobileFileType | null) => {
    let updatedMessage = message;
    if (isPrivate) {
      const regex = /@\[([\w\s]+)\]\((\d+)\)/g;
      const mentionMatches = message.match(regex);
      if (mentionMatches && mentionMatches.length > 0) {
        AnalyticsHelper.track(CONVERSATION_EVENTS.USED_MENTIONS, {
          conversationId,
          mentionCount: mentionMatches.length,
        });
      }
      updatedMessage = message.replace(
        regex,
        '[@$1](mention://user/$2/' + encodeURIComponent('$1') + ')',
      );
    }

    let messagePayload = {
      conversationId,
      message: updatedMessage,
      private: isPrivate,
      sender: {
        id: userId ?? 0,
        thumbnail: userThumbnail ?? '',
        name: userName ?? '',
      },
      files: [],
    } as SendMessagePayload;

    messagePayload = setReplyToInPayload(messagePayload);

    if (audioFile) {
      messagePayload.file = audioFile;
    }

    if (attachedFiles && attachedFiles.length) {
      AnalyticsHelper.track(CONVERSATION_EVENTS.SELECTED_ATTACHMENT, {
        conversationId,
        attachmentCount: attachedFiles.length,
      });
      // messagePayload.files = [];
      // TODO: Implement this
      // attachedFiles.forEach(attachment => {
      //   if (globalConfig.directUploadsEnabled) {
      //     messagePayload.files.push(attachment.blobSignedId);
      //   } else {
      //     messagePayload.files.push(attachment.resource.file);
      //   }
      // });
      // TODO: Add support for multiple files later
      const asset = attachedFiles[0];
      if (!asset.uri) {
        console.warn('ReplyBoxContainer: Attachment missing URI, skipping file attach');
      } else {
        messagePayload.file = {
          uri: asset.uri,
          fileName: asset.fileName ?? `file_${Date.now()}`,
          type: asset.type ?? 'application/octet-stream',
        };
      }
    }

    // TODO: Implement this
    if (ccEmails && !isPrivate) {
      messagePayload.ccEmails = ccEmails;
    }

    if (bccEmails && !isPrivate) {
      messagePayload.bccEmails = bccEmails;
    }

    if (toEmails && !isPrivate) {
      messagePayload.toEmails = toEmails;
    }

    return messagePayload;
  };

  const onRecordingComplete = async (audioFile: MobileFileType | null) => {
    confirmOnSendReply(audioFile);
  };

  const confirmOnSendReply = (audioFile: MobileFileType | null) => {
    hapticSelection?.();
    if (textInputRef && 'current' in textInputRef && textInputRef.current) {
      (textInputRef.current as TextInput).clear();
    }

    // const isOnWhatsApp =
    //   isATwilioWhatsAppChannel(inbox) ||
    //   isAWhatsAppCloudChannel(inbox) ||
    //   is360DialogWhatsAppChannel(inbox?.channelType);

    if (isPrivate) {
      AnalyticsHelper.track(CONVERSATION_EVENTS.SENT_PRIVATE_NOTE, { conversationId });
    } else {
      AnalyticsHelper.track(CONVERSATION_EVENTS.SENT_MESSAGE, { conversationId });
    }

    const undefinedVariables = getAllUndefinedVariablesInMessage({
      message: messageContent,
      variables: messageVariables,
    });

    if (undefinedVariables.length > 0) {
      const undefinedVariablesCount = undefinedVariables.length > 1 ? undefinedVariables.length : 1;
      const undefinedVariablesText = undefinedVariables.join(', ');
      const undefinedVariablesMessage = `You have ${undefinedVariablesCount} undefined variable(s) in your message: ${undefinedVariablesText}. Please check and try again with valid variables.`;
      Alert.alert(undefinedVariablesMessage);
    } else {
      const messagePayload = getMessagePayload(messageContent, audioFile);
      sendMessage(messagePayload);
    }
    // TODO: Implement this once we have add the support for multiple attachments
    // https://github.com/chatwoot/chatwoot/pull/6125
    // https://github.com/chatwoot/chatwoot/pull/6428
    // if (isOnWhatsApp && !isPrivate) {
    // sendMessageAsMultipleMessages(messageContent);
    // }
  };

  const sendMessage = (messagePayload: SendMessagePayload) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    // Reset UI state BEFORE dispatching to close the race window
    // where the user can tap send again with the same attachment data
    dispatch(resetSentMessage());
    setSelectedCannedResponse(null);
    dispatch(setMessageContent(''));
    setCCEmails('');
    setBCCEmails('');
    setToEmails('');

    dispatch(conversationActions.sendMessage(messagePayload)).finally(() => {
      isSendingRef.current = false;
    });

    requestAnimationFrame(() => {
      messageListRef?.current?.scrollToOffset({ offset: 0, animated: true });
    });
  };

  const shouldShowFileUpload =
    inbox &&
    (isAWebWidgetInbox(inbox) ||
      isAFacebookInbox(inbox) ||
      isAWhatsAppChannel(inbox) ||
      isAPIInbox(inbox) ||
      isASmsInbox(inbox) ||
      isAnEmailChannel(inbox) ||
      isATelegramChannel(inbox) ||
      isALineChannel(inbox) ||
      isAnInstagramChannel(inbox));

  const maxLength = () => {
    if (isPrivate) {
      return MESSAGE_MAX_LENGTH.GENERAL;
    }
    if (isAFacebookInbox(inbox)) {
      return MESSAGE_MAX_LENGTH.FACEBOOK;
    }
    if (isAWhatsAppChannel(inbox)) {
      return MESSAGE_MAX_LENGTH.TWILIO_WHATSAPP;
    }
    if (isASmsInbox(inbox)) {
      return MESSAGE_MAX_LENGTH.TWILIO_SMS;
    }
    if (isAnEmailChannel(inbox)) {
      return MESSAGE_MAX_LENGTH.EMAIL;
    }
    return MESSAGE_MAX_LENGTH.GENERAL;
  };

  const audioFormat = (): 'audio/m4a' | 'audio/wav' => {
    if (isAWhatsAppChannel(inbox) || isATelegramChannel(inbox) || isAnInstagramChannel(inbox)) {
      return 'audio/m4a';
    }
    return 'audio/wav';
  };

  const onSelectCannedResponse = (cannedResponse: CannedResponse) => {
    const updatedContent = replaceMessageVariables({
      message: cannedResponse.content,
      variables: messageVariables,
    });
    AnalyticsHelper.track(CONVERSATION_EVENTS.INSERTED_A_CANNED_RESPONSE);
    setSelectedCannedResponse(updatedContent);
  };

  const onPressVoiceRecordIcon = () => {
    setIsVoiceRecorderOpen(true);
    setAddMenuOptionSheetState(false);
  };

  const shouldShowCannedResponses = messageContent?.charAt(0) === '/';

  return (
    <AnimatedKeyboardStickyView
      style={[themedTailwind.style('bg-solid-1'), animatedInputWrapperStyle]}>
      {shouldShowCannedResponses && (
        <CannedResponses searchKey={messageContent} onSelect={onSelectCannedResponse} />
      )}

      <Animated.View
        layout={LinearTransition.springify().damping(80).stiffness(240)}
        style={themedTailwind.style(
          `pb-2 border-t-[1px] border-t-slate-6 ${shouldShowReplyHeader ? 'pt-0' : 'pt-2'}`,
        )}>
        {quoteMessage && (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(10)}>
            <QuoteReply />s
          </Animated.View>
        )}

        {shouldShowReplyHeader && (
          <ReplyEmailHead
            ccEmails={ccEmails}
            bccEmails={bccEmails}
            toEmails={toEmails}
            onUpdateCC={setCCEmails}
            onUpdateBCC={setBCCEmails}
            onUpdateTo={setToEmails}
          />
        )}

        {typingText && <TypingIndicator typingText={typingText} />}

        {isVoiceRecorderOpen ? (
          <AudioRecorder onRecordingComplete={onRecordingComplete} audioFormat={audioFormat()} />
        ) : null}
        {!isVoiceRecorderOpen ? (
          <Animated.View style={tailwind.style('flex flex-row px-1 items-end z-20 relative')}>
            {attachmentsLength === 0 && shouldShowFileUpload && (
              <AddCommandButton
                onPress={handleShowAddMenuOption}
                derivedAddMenuOptionStateValue={
                  derivedAddMenuOptionStateValue as unknown as import('react-native-reanimated').SharedValue<number>
                }
              />
            )}
            <MessageTextInput
              maxLength={maxLength()}
              replyEditorMode={replyEditorMode}
              selectedCannedResponse={selectedCannedResponse}
              agents={agents as Agent[]}
              messageContent={messageContent}
            />
            <Pressable
              onPress={handleTogglePrivateMode}
              disabled={replyEditorMode !== REPLY_EDITOR_MODES.REPLY}
              hitSlop={4}
              style={tailwind.style('flex items-center justify-center h-10 w-10')}>
              {isPrivate ? (
                <Lock size={20} strokeWidth={2} color={colors.amber[9]} />
              ) : (
                <LockOpen size={20} strokeWidth={2} color={colors.slate[11]} />
              )}
            </Pressable>
            {(messageContent.length > 0 || attachmentsLength > 0) && (
              <SendMessageButton onPress={() => confirmOnSendReply(null)} />
            )}
            {messageContent.length === 0 && attachmentsLength === 0 && shouldShowFileUpload ? (
              <VoiceRecordButton onPress={onPressVoiceRecordIcon} />
            ) : null}
          </Animated.View>
        ) : null}
      </Animated.View>

      {isAddMenuOptionSheetOpen ? (
        <CommandOptionsMenu />
      ) : attachmentsLength > 0 ? (
        <AttachedMedia />
      ) : null}
    </AnimatedKeyboardStickyView>
  );
};

export const ReplyBoxContainer = () => {
  return <BottomSheetContent />;
};
