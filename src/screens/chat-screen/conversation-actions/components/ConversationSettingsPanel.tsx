import React from 'react';
import Animated from 'react-native-reanimated';

import { tailwind, useBoxShadow } from '@infrastructure/theme';
import { Agent, ConversationPriority } from '@domain/types';
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
  const cardShadow = useBoxShadow('card');

  return (
    <Animated.View
      style={[tailwind.style('rounded-[13px] mx-4 bg-solid-1'), { boxShadow: cardShadow }]}>
      <AssigneePanel assignee={assignee} onPress={onChangeAssignee} isFirstItem={true} />
      {/* Team assignment disabled — not currently in use */}
      {/* <TeamPanel team={team} onPress={onChangeTeamAssignee} /> */}
      <PriorityPanel priority={priority} onPress={onChangePriority} isLastItem={true} />
    </Animated.View>
  );
};
