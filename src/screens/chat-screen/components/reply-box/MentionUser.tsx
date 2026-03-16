import React from 'react';
import { Agent } from '@domain/types';
import { Avatar, SelectableListCell } from '@infrastructure/ui';

type MentionUserProps = {
  agent: Agent;
  lastItem: boolean;
  onPress: () => void;
};

export const MentionUser = (props: MentionUserProps) => {
  const { lastItem, agent, onPress } = props;
  return (
    <SelectableListCell
      leftContent={
        <Avatar src={{ uri: agent.thumbnail || undefined }} name={agent.name ?? ''} size="md" />
      }
      label={agent.name ?? ''}
      isLastItem={lastItem}
      onPress={onPress}
    />
  );
};
