import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { Agent } from '@domain/types';
import { Avatar, SearchBar, SelectableListCell } from '@infrastructure/ui';

import { assignableAgentActions } from '@application/store/assignable-agent/assignableAgentActions';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import {
  selectAssignableParticipantsByInboxId,
  isAssignableAgentFetching,
} from '@application/store/assignable-agent/assignableAgentSelectors';
import { selectSelectedConversation } from '@application/store/conversation/conversationSelectedSlice';
import { showToast } from '@infrastructure/utils/toastUtils';
import { useSearchableBottomSheet } from '@infrastructure/utils/useSearchableBottomSheet';
import i18n from '@infrastructure/i18n';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { conversationParticipantActions } from '@application/store/conversation-participant/conversationParticipantActions';

const ParticipantStack = ({
  allAgents,
  activeConversationParticipants,
}: {
  allAgents: Agent[];
  activeConversationParticipants: Agent[];
}) => {
  const isFetching = useAppSelector(isAssignableAgentFetching);

  const dispatch = useAppDispatch();

  const selectedConversation = useAppSelector(selectSelectedConversation);

  const updatedAgents = allAgents.map(agent => {
    return {
      ...agent,
      isParticipant: activeConversationParticipants.some(
        participant => participant.id === agent.id,
      ),
    };
  });

  const handleAssigneePress = async (item: Agent & { isParticipant: boolean }) => {
    let updateAgentList = [...activeConversationParticipants];
    if (item.isParticipant) {
      updateAgentList = updateAgentList.filter(agent => agent.id !== item.id);
    } else {
      updateAgentList.push(item);
    }
    const userIds = updateAgentList.map(agent => agent.id);
    if (selectedConversation) {
      await dispatch(
        conversationParticipantActions.update({
          conversationId: selectedConversation?.id,
          userIds,
        }),
      );
      AnalyticsHelper.track(CONVERSATION_EVENTS.PARTICIPANT_CHANGED);
      showToast({
        message: i18n.t('CONVERSATION.PARTICIPANT_CHANGE'),
      });
    }
  };

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false} style={tailwind.style('my-1 pl-3')}>
      {isFetching ? (
        <ActivityIndicator />
      ) : (
        updatedAgents.map((value, index) => (
          <SelectableListCell
            key={value.id}
            leftContent={
              <Avatar
                src={{ uri: value.thumbnail || undefined }}
                name={value.name ?? ''}
                size="md"
              />
            }
            label={value.name ?? ''}
            isSelected={value.isParticipant}
            isLastItem={index === updatedAgents.length - 1}
            onPress={() => handleAssigneePress(value)}
          />
        ))
      )}
    </BottomSheetScrollView>
  );
};

type UpdateParticipantProps = {
  activeConversationParticipants: Agent[];
};

export const UpdateParticipant = (props: UpdateParticipantProps) => {
  const { activeConversationParticipants } = props;
  const dispatch = useAppDispatch();
  const { updateParticipantSheetRef } = useRefsContext();
  const { searchTerm, handleChangeText, handleFocus, handleBlur } =
    useSearchableBottomSheet(updateParticipantSheetRef);

  const selectedConversation = useAppSelector(selectSelectedConversation);

  const inboxId = selectedConversation?.inboxId;

  const inboxIds = inboxId ? [inboxId] : [];

  const selectAgents = useAppSelector(selectAssignableParticipantsByInboxId);
  const allAgents = inboxId ? selectAgents(inboxId, searchTerm) : [];

  useEffect(() => {
    dispatch(assignableAgentActions.fetchAgents({ inboxIds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.Fragment>
      <SearchBar
        isInsideBottomSheet
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        placeholder={i18n.t('CONVERSATION.ASSIGNEE.AGENTS.SEARCH_AGENT')}
      />
      <ParticipantStack
        allAgents={allAgents}
        activeConversationParticipants={activeConversationParticipants}
      />
    </React.Fragment>
  );
};
