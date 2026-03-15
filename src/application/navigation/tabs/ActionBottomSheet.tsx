import React, { useMemo } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { useSheetDefaults } from '@infrastructure/utils';
import {
  resetActionState,
  selectCurrentActionState,
} from '@application/store/conversation/conversationActionSlice';

import { useRefsContext } from '@infrastructure/context';
// eslint-disable-next-line no-restricted-imports -- Navigation uses shared conversation action components
import {
  UpdateAssignee,
  UpdateStatus,
  UpdateLabels,
  UpdateTeam,
  UpdatePriority,
} from '@/screens/conversations/components/conversation-actions';

const ActionBottomSheet = () => {
  const sheetDefaults = useSheetDefaults();
  const dispatch = useAppDispatch();
  const currentActionState = useAppSelector(selectCurrentActionState);

  const { actionsModalSheetRef } = useRefsContext();

  const { snapPoints: actionSnapPoints, index: actionIndex } = useMemo(() => {
    switch (currentActionState) {
      case 'Assign':
        return { snapPoints: ['50%'], index: 0 };
      case 'Status':
        return { snapPoints: [250], index: 0 };
      case 'Label':
        return { snapPoints: [400, '75%'], index: 1 };
      case 'Priority':
        return { snapPoints: [300], index: 0 };
      case 'TeamAssign':
        return { snapPoints: ['50%'], index: 0 };
      default:
        return { snapPoints: [250], index: 0 };
    }
  }, [currentActionState]);

  const handleOnDismiss = () => {
    dispatch(resetActionState());
  };

  return (
    <BottomSheetModal
      ref={actionsModalSheetRef}
      {...sheetDefaults}
      snapPoints={actionSnapPoints}
      index={actionIndex}
      onDismiss={handleOnDismiss}>
      {currentActionState === 'Assign' ? <UpdateAssignee /> : null}
      {currentActionState === 'TeamAssign' ? <UpdateTeam /> : null}
      {currentActionState === 'Status' ? <UpdateStatus /> : null}
      {currentActionState === 'Label' ? <UpdateLabels /> : null}
      {currentActionState === 'Priority' ? <UpdatePriority /> : null}
    </BottomSheetModal>
  );
};

export default ActionBottomSheet;
