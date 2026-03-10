import React from 'react';
// import { useEffect } from 'react'; // Team assignment disabled — not currently in use
import { Alert, Dimensions, Platform, Share } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { BottomSheetModal, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';

import { BottomSheetBackdrop, Button } from '@infrastructure/ui';
import {
  ConversationBasicActions,
  ConversationLabelActions,
  ConversationSettingsPanel,
  AddParticipantList,
  UpdateParticipant,
} from './components';
import { TAB_BAR_HEIGHT } from '@domain/constants';
import { tailwind } from '@infrastructure/theme';
import { ConversationStatus } from '@domain/types';
import i18n from '@infrastructure/i18n';
import { useChatWindowContext, useRefsContext } from '@infrastructure/context';
import { useAppDispatch, useAppSelector, useThemedStyles } from '@/hooks';
import { selectConversationById } from '@application/store/conversation/conversationSelectors';
import { conversationActions } from '@application/store/conversation/conversationActions';

import { setActionState } from '@application/store/conversation/conversationActionSlice';
import { selectSingleConversation } from '@application/store/conversation/conversationSelectedSlice';
// import { teamActions } from '@application/store/team/teamActions';
// import { selectAllTeams } from '@application/store/team/teamSelectors';
import { selectInstallationUrl } from '@application/store/settings/settingsSelectors';
import { ConversationMetaInformation } from './components/ConversationMetaInformation';
import { selectConversationParticipantsByConversationId } from '@application/store/conversation-participant/conversationParticipantSelectors';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

const SCREEN_WIDTH = Dimensions.get('screen').width;

export type ConversationActionType = 'mute' | 'status' | 'unmute';

export const ConversationActions = () => {
  const dispatch = useAppDispatch();
  const themedTailwind = useThemedStyles();
  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 80,
  });
  const { updateParticipantSheetRef, actionsModalSheetRef } = useRefsContext();
  const { conversationId } = useChatWindowContext();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));

  const installationUrl = useAppSelector(selectInstallationUrl);

  const { status, muted: isMuted, meta, priority = null } = conversation || {};
  const { assignee } = meta || {};
  // Team assignment disabled — not currently in use
  // const { team } = meta || {};
  // const teams = useAppSelector(selectAllTeams);
  // const currentTeam = teams.find(t => t.id === team?.id) || null;

  const currentLabels = conversation?.labels || [];

  const conversationParticipants = useAppSelector(state =>
    selectConversationParticipantsByConversationId(state, conversationId),
  );

  // Team assignment disabled — not currently in use
  // useEffect(() => {
  //   dispatch(teamActions.fetchTeams());
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const onShareConversation = async () => {
    try {
      const url = `${installationUrl}app/accounts/${conversation?.accountId}/conversations/${conversation?.id}`;

      const message = Platform.OS === 'android' ? url : '';

      const result = await Share.share({
        message,
        url,
      });

      if (result.action === Share.sharedAction) {
        AnalyticsHelper.track(CONVERSATION_EVENTS.CONVERSATION_SHARE, {
          conversationId,
        });
      }
    } catch (error) {
      Alert.alert((error as Error).message);
    }
  };

  const updateConversationStatus = (type: ConversationActionType, status?: ConversationStatus) => {
    if (type === 'mute') {
      dispatch(conversationActions.muteConversation({ conversationId }));
      AnalyticsHelper.track(CONVERSATION_EVENTS.MUTE_CONVERSATION, { conversationId });
    } else if (type === 'unmute') {
      dispatch(conversationActions.unmuteConversation({ conversationId }));
      AnalyticsHelper.track(CONVERSATION_EVENTS.UN_MUTE_CONVERSATION, { conversationId });
    } else {
      dispatch(
        conversationActions.toggleConversationStatus({
          conversationId,
          payload: { status: status as ConversationStatus, snoozed_until: null },
        }),
      );
      AnalyticsHelper.track(CONVERSATION_EVENTS.TOGGLE_STATUS, {
        conversationId,
        status,
      });
      if (status === 'resolved') {
        AnalyticsHelper.track(CONVERSATION_EVENTS.RESOLVE_CONVERSATION_STATUS, {
          conversationId,
        });
      }
    }
  };

  const onChangeAssignee = () => {
    if (!conversation) return;
    dispatch(selectSingleConversation(conversation));
    dispatch(setActionState('Assign'));
    actionsModalSheetRef.current?.present();
  };

  // Team assignment disabled — not currently in use
  // const onChangeTeamAssignee = () => {
  //   if (!conversation) return;
  //   dispatch(selectSingleConversation(conversation));
  //   dispatch(setActionState('TeamAssign'));
  //   actionsModalSheetRef.current?.present();
  // };

  const onChangePriority = () => {
    if (!conversation) return;
    dispatch(selectSingleConversation(conversation));
    dispatch(setActionState('Priority'));
    actionsModalSheetRef.current?.present();
  };

  const onAddParticipant = () => {
    if (!conversation) return;
    dispatch(selectSingleConversation(conversation));
    updateParticipantSheetRef.current?.present();
  };

  return (
    <Animated.View style={tailwind.style('', `w-[${SCREEN_WIDTH}px]`)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT}]`)}>
        <ConversationBasicActions
          status={status}
          updateConversationStatus={updateConversationStatus}
          isMuted={isMuted || false}
        />
        <Animated.View style={tailwind.style('pt-10')}>
          <ConversationSettingsPanel
            assignee={assignee || null}
            priority={priority || null}
            onChangeAssignee={onChangeAssignee}
            onChangePriority={onChangePriority}
          />
        </Animated.View>
        <Animated.View style={tailwind.style('pt-10')}>
          <ConversationLabelActions labels={currentLabels} />
        </Animated.View>
        <Animated.View style={tailwind.style('pt-10')}>
          <AddParticipantList
            conversationParticipants={conversationParticipants}
            onAddParticipant={onAddParticipant}
          />
        </Animated.View>
        <Animated.View style={tailwind.style('pt-10')}>
          {conversation && <ConversationMetaInformation conversation={conversation} />}
        </Animated.View>
        <Animated.View style={tailwind.style('px-4 pt-10')}>
          <Button
            variant="secondary"
            handlePress={onShareConversation}
            text={i18n.t('CONVERSATION.ACTIONS.SHARE')}
          />
        </Animated.View>
      </ScrollView>
      <BottomSheetModal
        ref={updateParticipantSheetRef}
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        backgroundStyle={themedTailwind.style('bg-solid-1')}
        animationConfigs={animationConfigs}
        enablePanDownToClose
        snapPoints={['50%']}>
        <UpdateParticipant activeConversationParticipants={conversationParticipants} />
      </BottomSheetModal>
    </Animated.View>
  );
};
