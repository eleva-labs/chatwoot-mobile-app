import React, { useMemo } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { spring } from '@infrastructure/animation';
import { tailwind } from '@infrastructure/theme';
import { BottomSheetBackdrop } from '@infrastructure/ui';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { useThemedStyles } from '@infrastructure/hooks';
import { useBottomSheetInset } from '@infrastructure/utils';
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
  const bottomSheetInset = useBottomSheetInset();
  const dispatch = useAppDispatch();
  const currentActionState = useAppSelector(selectCurrentActionState);
  const themedTailwind = useThemedStyles();

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
      backdropComponent={BottomSheetBackdrop}
      handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
      handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
      style={tailwind.style('rounded-[26px] overflow-hidden')}
      backgroundStyle={themedTailwind.style('bg-solid-1')}
      animationConfigs={spring.sheet}
      enablePanDownToClose
      bottomInset={bottomSheetInset}
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
