import React, { useCallback, useState } from 'react';

import { useRefsContext } from '@infrastructure/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectSelectedIds } from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { LABEL_EVENTS } from '@domain/constants/analyticsEvents';

import { LabelPicker } from './LabelPicker';

export const UpdateLabels = () => {
  const { actionsModalSheetRef } = useRefsContext();
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedIds);

  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const handleFocus = () => {
    actionsModalSheetRef.current?.expand();
  };
  const handleBlur = () => {
    actionsModalSheetRef.current?.dismiss({ overshootClamping: true });
  };

  const handleLabelPress = useCallback(
    (_selectedLabel: string) => {
      setSelectedLabels(prevLabels => {
        const isRemoving = prevLabels.includes(_selectedLabel);
        const updatedLabels = isRemoving
          ? prevLabels.filter(item => item !== _selectedLabel)
          : [...prevLabels, _selectedLabel];

        const payload = {
          type: 'Conversation',
          ids: selectedIds,
          labels: isRemoving
            ? { add: [], remove: [_selectedLabel] }
            : { add: [_selectedLabel], remove: [] },
        };

        dispatch(conversationActions.bulkAction(payload));

        AnalyticsHelper.track(LABEL_EVENTS.APPLY_LABEL, {
          label: _selectedLabel,
          bulkAction: true,
          conversationCount: selectedIds.length,
          action: isRemoving ? 'remove' : 'add',
        });

        return updatedLabels;
      });
    },
    [selectedIds, dispatch],
  );

  return (
    <LabelPicker
      selectedLabels={selectedLabels}
      onToggleLabel={handleLabelPress}
      onSearchFocus={handleFocus}
      onSearchBlur={handleBlur}
    />
  );
};
