import React, { useCallback, useState } from 'react';

import { useRefsContext } from '@infrastructure/context';
import { useSearchableBottomSheet } from '@infrastructure/utils/useSearchableBottomSheet';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { selectSelectedIds } from '@application/store/conversation/conversationSelectedSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { LABEL_EVENTS } from '@domain/constants/analyticsEvents';

import { LabelPicker } from '@infrastructure/ui/label-picker';

export const UpdateLabels = () => {
  const { actionsModalSheetRef } = useRefsContext();
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedIds);

  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const { handleFocus: onSearchFocus, handleBlur: onSearchBlur } =
    useSearchableBottomSheet(actionsModalSheetRef);

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
      onSearchFocus={onSearchFocus}
      onSearchBlur={onSearchBlur}
    />
  );
};
