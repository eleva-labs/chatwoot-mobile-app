import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { Agent, ConversationPriority } from '@/types';
import AssigneePanel from './AssigneePanel';
// import TeamPanel from './TeamPanel';
import PriorityPanel from './PriorityPanel';

type ConversationSettingsPanelProps = {
  priority: ConversationPriority;
  // team: Team | null;
  assignee: Agent | null;
  onChangeAssignee: () => void;
  // onChangeTeamAssignee: () => void;
  onChangePriority: () => void;
};

export const ConversationSettingsPanel = ({
  assignee,
  // team,
  priority,
  onChangeAssignee,
  // onChangeTeamAssignee,
  onChangePriority,
}: ConversationSettingsPanelProps) => {
  return (
    <Animated.View
      style={[
        tailwind.style('rounded-[13px] mx-4 bg-solid-1'),
        styles.listShadow,
        Platform.OS === 'android' && { backgroundColor: tailwind.color('bg-solid-1') ?? 'white' },
      ]}>
      <AssigneePanel assignee={assignee} onPress={onChangeAssignee} />
      {/* Team assignment disabled — not currently in use */}
      {/* <TeamPanel team={team} onPress={onChangeTeamAssignee} /> */}
      <PriorityPanel priority={priority} onPress={onChangePriority} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listShadow:
    Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)',
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
