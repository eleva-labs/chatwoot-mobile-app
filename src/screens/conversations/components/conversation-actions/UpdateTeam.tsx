import React from 'react';
import { ActivityIndicator } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { Team } from '@domain/types';
import { Avatar, SearchBar, SelectableListCell } from '@infrastructure/ui';

import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { selectSelectedConversation } from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { selectLoading, filterTeams } from '@application/store/team/teamSelectors';
import { showToast } from '@infrastructure/utils/toastUtils';
import { useSearchableBottomSheet } from '@infrastructure/utils/useSearchableBottomSheet';
import i18n from '@infrastructure/i18n';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';

const TeamStack = ({
  teams,
  teamId,
  onTeamPress,
}: {
  teams: Team[];
  teamId: number | undefined;
  onTeamPress: (team: Team) => void;
}) => {
  const isFetching = useAppSelector(selectLoading);

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false} style={tailwind.style('my-1 pl-3')}>
      {isFetching ? (
        <ActivityIndicator />
      ) : (
        teams.map((value, index) => (
          <SelectableListCell
            key={value.id}
            leftContent={<Avatar name={value.name ?? ''} size="md" />}
            label={value.name ?? ''}
            isSelected={teamId === value.id}
            isLastItem={index === teams.length - 1}
            onPress={() => onTeamPress(value)}
          />
        ))
      )}
    </BottomSheetScrollView>
  );
};

export const UpdateTeam = () => {
  const { actionsModalSheetRef } = useRefsContext();
  const dispatch = useAppDispatch();
  const { searchTerm, handleChangeText, handleFocus, handleBlur } =
    useSearchableBottomSheet(actionsModalSheetRef);

  const selectedConversation = useAppSelector(selectSelectedConversation);

  const teams = useAppSelector(state => filterTeams(state, searchTerm));

  const teamId = selectedConversation?.meta?.team?.id;

  const handleTeamPress = async (team: Team) => {
    if (!selectedConversation?.id) return;
    await dispatch(
      conversationActions.assignConversation({
        conversationId: selectedConversation.id,
        teamId: team.id === teamId ? undefined : team.id,
      }),
    );
    AnalyticsHelper.track(CONVERSATION_EVENTS.TEAM_CHANGED);
    showToast({
      message: i18n.t('CONVERSATION.TEAM_CHANGE'),
    });
    actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
  };

  return (
    <React.Fragment>
      <SearchBar
        isInsideBottomSheet
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        placeholder={i18n.t('CONVERSATION.SEARCH_TEAM')}
      />
      <TeamStack teams={teams} teamId={teamId} onTeamPress={handleTeamPress} />
    </React.Fragment>
  );
};
