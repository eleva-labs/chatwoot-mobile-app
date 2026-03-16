import React from 'react';
import Animated from 'react-native-reanimated';

import { tailwind, useBoxShadow } from '@infrastructure/theme';
import { Agent, ConversationPriority } from '@domain/types';
import AssigneePanel from './AssigneePanel';
import PriorityPanel from './PriorityPanel';

type ConversationSettingsPanelProps = {
  priority: ConversationPriority;
  assignee: Agent | null;
  onChangeAssignee: () => void;
  onChangePriority: () => void;
};

export const ConversationSettingsPanel = ({
  assignee,
  priority,
  onChangeAssignee,
  onChangePriority,
}: ConversationSettingsPanelProps) => {
  const cardShadow = useBoxShadow('card');

  return (
    <Animated.View
      style={[tailwind.style('rounded-[13px] mx-4 bg-solid-1'), { boxShadow: cardShadow }]}>
      <AssigneePanel assignee={assignee} onPress={onChangeAssignee} isFirstItem={true} />
      <PriorityPanel priority={priority} onPress={onChangePriority} isLastItem={true} />
    </Animated.View>
  );
};
