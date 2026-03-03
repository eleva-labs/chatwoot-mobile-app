import React, { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TickIcon } from '@/svg-icons/common/TickIcon';

import { useRefsContext } from '@infrastructure/context';
import { tailwind } from '@infrastructure/theme';
import { Team } from '@domain/types';
import { Avatar, SearchBar } from '@infrastructure/ui';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectSelectedConversation } from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import { selectLoading } from '@application/store/team/teamSelectors';
import { showToast } from '@infrastructure/utils/toastUtils';
import i18n from '@infrastructure/i18n';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { filterTeams } from '@application/store/team/teamSelectors';

type TeamCellProps = {
  value: Team;
  lastItem: boolean;
  teamId: number | undefined;
};

const TeamCell = (props: TeamCellProps) => {
  const { value, lastItem, teamId } = props;
  const dispatch = useAppDispatch();

  const { actionsModalSheetRef } = useRefsContext();
  const selectedConversation = useAppSelector(selectSelectedConversation);

  const handleAssigneePress = async () => {
    if (!selectedConversation?.id) return;
    await dispatch(
      conversationActions.assignConversation({
        conversationId: selectedConversation?.id,
        teamId: value.id === teamId ? undefined : value.id,
      }),
    );
    AnalyticsHelper.track(CONVERSATION_EVENTS.TEAM_CHANGED);
    showToast({
      message: i18n.t('CONVERSATION.TEAM_CHANGE'),
    });
    actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
  };

  return (
    <Pressable onPress={handleAssigneePress} style={tailwind.style('flex flex-row items-center')}>
      <Avatar name={value.name ?? ''} size="md" />
      <Animated.View
        style={tailwind.style(
          'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
          !lastItem ? 'border-b-[1px] border-slate-6' : '',
        )}>
        <Animated.Text
          style={[
            tailwind.style(
              'text-base text-slate-12 font-inter-420-20 leading-[21px] tracking-[0.16px]',
            ),
          ]}>
          {value.name}
        </Animated.Text>
        {teamId === value.id ? (
          <TickIcon size={20} color={tailwind.color('text-slate-12')} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

const TeamStack = ({ teams, teamId }: { teams: Team[]; teamId: number | undefined }) => {
  const isFetching = useAppSelector(selectLoading);

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false} style={tailwind.style('my-1 pl-3')}>
      {isFetching ? (
        <ActivityIndicator />
      ) : (
        teams.map((value, index) => {
          return (
            <TeamCell key={index} {...{ value, lastItem: index === teams.length - 1, teamId }} />
          );
        })
      )}
    </BottomSheetScrollView>
  );
};

export const UpdateTeam = () => {
  const { actionsModalSheetRef } = useRefsContext();
  const [searchTerm, setSearchTerm] = useState('');

  const selectedConversation = useAppSelector(selectSelectedConversation);

  const teams = useAppSelector(state => filterTeams(state, searchTerm));

  const teamId = selectedConversation?.meta?.team?.id;

  const handleFocus = () => {
    actionsModalSheetRef.current?.expand();
  };
  const handleBlur = () => {
    actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
  };

  const handleChangeText = (text: string) => {
    setSearchTerm(text);
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
      <TeamStack teams={teams} teamId={teamId} />
    </React.Fragment>
  );
};
