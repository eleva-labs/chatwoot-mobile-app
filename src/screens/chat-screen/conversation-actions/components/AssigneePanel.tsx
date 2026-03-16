import React from 'react';
import { Avatar, Icon } from '@infrastructure/ui';
import { UnassignedIcon } from '@/svg-icons';
import { SettingsRow } from '@infrastructure/ui/list-components/SettingsRow';
import { Agent } from '@domain/types';
import i18n from '@infrastructure/i18n';

type AssigneePanelProps = {
  assignee: Agent | null;
  onPress: () => void;
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

const AssigneePanel = ({
  assignee,
  onPress,
  isFirstItem = false,
  isLastItem = false,
}: AssigneePanelProps) => {
  const leftContent = assignee ? (
    <Avatar size="md" src={{ uri: assignee?.thumbnail || '' }} name={assignee?.name || ''} />
  ) : (
    <Icon icon={<UnassignedIcon />} />
  );

  const label = assignee ? (assignee.name ?? '') : i18n.t('CONVERSATION.ACTIONS.ASSIGNEE.EMPTY');

  const actionText = assignee
    ? i18n.t('CONVERSATION.ACTIONS.ASSIGNEE.EDIT')
    : i18n.t('CONVERSATION.ACTIONS.ASSIGNEE.ASSIGN');

  return (
    <SettingsRow
      leftContent={leftContent}
      label={label}
      actionText={actionText}
      isFirstItem={isFirstItem}
      isLastItem={isLastItem}
      onPress={onPress}
    />
  );
};

export default AssigneePanel;
