import React, { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, ScrollView } from 'react-native';
import Animated, { LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { useChatWindowContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { useAppDispatch, useAppSelector, useThemedStyles } from '@/hooks';

import { MentionInput, MentionSuggestionsProps, Suggestion } from './mentions-input';
import {
  setMessageContent,
  selectIsPrivateMessage,
  selectQuoteMessage,
  selectMessageContent,
} from '@application/store/conversation/sendMessageSlice';
import i18n from '@infrastructure/i18n';
import { createTypingIndicator } from '@chatwoot/utils';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { MentionUser } from './MentionUser';
import { Agent } from '@domain/types';

type MessageTextInputProps = {
  maxLength: number;
  replyEditorMode: string;
  selectedCannedResponse?: string | null;
  agents: Agent[];
  messageContent: string;
};
type AgentSuggestion = Omit<Agent, 'id'> & Suggestion;

const TYPING_INDICATOR_IDLE_TIME = 4000;

export const MessageTextInput = ({
  maxLength,
  selectedCannedResponse,
  agents,
}: MessageTextInputProps) => {
  const themedTailwind = useThemedStyles();
  const dispatch = useAppDispatch();
  const messageContent = useAppSelector(selectMessageContent);

  const { setAddMenuOptionSheetState, textInputRef, setIsTextInputFocused, conversationId } =
    useChatWindowContext();

  const isPrivateMessage = useAppSelector(selectIsPrivateMessage);
  const quoteMessage = useAppSelector(selectQuoteMessage);

  const dispatchTypingStatus = useCallback(
    (status: 'on' | 'off') => {
      dispatch(
        conversationActions.toggleTyping({
          conversationId,
          typingStatus: status,
          isPrivate: isPrivateMessage,
        }),
      );
    },
    [dispatch, conversationId, isPrivateMessage],
  );

  const typingIndicator = useMemo(
    () =>
      createTypingIndicator(
        () => dispatchTypingStatus('on'),
        () => dispatchTypingStatus('off'),
        TYPING_INDICATOR_IDLE_TIME,
      ),
    [dispatchTypingStatus],
  );

  const startTyping = useCallback(() => {
    typingIndicator.start();
  }, [typingIndicator]);

  const onBlur = useCallback(() => {
    typingIndicator.stop();
  }, [typingIndicator]);

  useEffect(() => {
    return () => typingIndicator.stop();
  }, [typingIndicator]);

  const onChangeText = (text: string) => {
    startTyping();
    dispatch(setMessageContent(text));
  };

  const handleOnFocus = useCallback(
    () => {
      setAddMenuOptionSheetState(false);
      setIsTextInputFocused(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (selectedCannedResponse) onChangeText(selectedCannedResponse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCannedResponse]);

  useEffect(() => {
    if (quoteMessage !== null) {
      // Focussing Text Input when you have decided to reply
      // @ts-expect-error TextInput ref focus method may not be properly typed
      textInputRef?.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteMessage]);

  const handleOnBlur = useCallback(
    () => {
      // shouldHandleKeyboardEvents.value = false;
      setIsTextInputFocused(false);
      onBlur();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const renderSuggestions: (
    suggestions: Agent[],
  ) => (props: MentionSuggestionsProps) => ReactNode =
    suggestions =>
    // eslint-disable-next-line react/display-name
    ({ keyword, onSuggestionPress }: MentionSuggestionsProps) => {
      if (keyword == null || !isPrivateMessage) {
        return null;
      }
      const filteredSuggestions = suggestions.filter(one =>
        one.name?.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
      );
      return (
        <Animated.View
          style={[
            tailwind.style(
              'bg-solid-1 border-t border-slate-6 rounded-[13px] mx-4 px-2 w-full max-h-[250px]',
              Platform.OS === 'ios' ? 'absolute bottom-full' : 'relative h-[150px]',
            ),
            styles.listShadow,
            Platform.OS === 'android' && {
              backgroundColor: tailwind.color('bg-solid-1') ?? 'white',
            },
          ]}>
          <ScrollView keyboardShouldPersistTaps="always">
            {filteredSuggestions.map(agent => {
              const agentSuggestion: AgentSuggestion = {
                ...agent,
                id: String(agent.id),
                name: agent.name || '',
              };
              return (
                <MentionUser
                  key={agent.id}
                  agent={agent}
                  lastItem={false}
                  onPress={() => onSuggestionPress(agentSuggestion)}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      );
    };
  const renderMentionSuggestions = renderSuggestions(agents);

  return (
    <LayoutAnimationConfig skipEntering={true}>
      <Animated.View
        layout={LinearTransition.springify().damping(28).stiffness(200)}
        style={[tailwind.style('flex-1 my-0.5')]}>
        <MentionInput
          // @ts-expect-error MentionInput ref typing issue with forwardRef
          ref={textInputRef}
          layout={LinearTransition.springify().damping(28).stiffness(200)}
          onChange={onChangeText}
          partTypes={[
            {
              trigger: '@',
              renderSuggestions: renderMentionSuggestions,
              textStyle: tailwind.style('text-amber-12 font-inter-medium-24'),
              allowedSpacesCount: 0,
              isInsertSpaceAfterMention: true,
            },
          ]}
          maxNumberOfLines={3}
          multiline
          enablesReturnKeyAutomatically
          style={[
            themedTailwind.style(
              'text-base font-inter-normal-20 tracking-[0.24px] leading-[20px] android:leading-[18px]',
              'ml-[5px] mr-2 py-2 px-3 rounded-2xl text-slate-12',
              'min-h-9 max-h-[76px]',
              isPrivateMessage ? 'bg-solid-amber' : 'bg-slate-3',
            ),
            // TODO: Try settings includeFontPadding to false and have a single lineHeight value of 20
          ]}
          placeholderTextColor={themedTailwind.color('text-slate-9')}
          maxLength={maxLength}
          placeholder={
            isPrivateMessage
              ? `${i18n.t('CONVERSATION.PRIVATE_MSG_INPUT')}`
              : `${i18n.t('CONVERSATION.TYPE_MESSAGE')}`
          }
          onSubmitEditing={() => setMessageContent('')}
          value={messageContent}
          returnKeyType={'default'}
          textAlignVertical="top"
          underlineColorAndroid="transparent"
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
        />
      </Animated.View>
    </LayoutAnimationConfig>
  );
};

const styles = StyleSheet.create({
  listShadow:
    Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)', // Intentional: shadow alpha, universal across themes
        shadowOffset: { width: 0, height: 0.15 },
        shadowRadius: 2,
        shadowOpacity: 0.35,
        elevation: 2,
      },
      android: {
        elevation: 4,
      },
    }) || {}, // Add fallback empty object
});
