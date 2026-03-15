import React from 'react';
import { Icon, PriorityIndicator } from '@infrastructure/ui';
import { NoPriorityIcon } from '@/svg-icons';
import { SettingsRow } from '@infrastructure/ui/list-components/SettingsRow';
import { ConversationPriority } from '@domain/types';
import i18n from '@infrastructure/i18n';

type PriorityPanelProps = {
  priority: ConversationPriority;
  onPress: () => void;
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

const PriorityPanel = ({
  priority,
  onPress,
  isFirstItem = false,
  isLastItem = false,
}: PriorityPanelProps) => {
  const leftContent = priority ? (
    <PriorityIndicator priority={priority} />
  ) : (
    <Icon icon={<NoPriorityIcon />} />
  );

  const label = priority
    ? i18n.t(`CONVERSATION.PRIORITY.OPTIONS.${priority.toUpperCase()}`)
    : i18n.t('CONVERSATION.ACTIONS.PRIORITY.EMPTY');

  return (
    <SettingsRow
      leftContent={leftContent}
      label={label}
      actionText={i18n.t('CONVERSATION.ACTIONS.PRIORITY.EDIT')}
      isFirstItem={isFirstItem}
      isLastItem={isLastItem}
      onPress={onPress}
    />
  );
};

export default PriorityPanel;
