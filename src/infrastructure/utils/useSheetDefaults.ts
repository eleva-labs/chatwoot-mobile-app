import { useMemo } from 'react';
import type { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { spring } from '@infrastructure/animation';
import { useThemedStyles } from '@infrastructure/hooks';
import { BottomSheetBackdrop } from '@infrastructure/ui/common/bottomsheet/BottomSheetBackdrop';
import { useBottomSheetInset } from './useBottomSheetInset';

type SheetDefaults = Pick<
  BottomSheetModalProps,
  | 'backdropComponent'
  | 'handleIndicatorStyle'
  | 'handleStyle'
  | 'style'
  | 'backgroundStyle'
  | 'animationConfigs'
  | 'enablePanDownToClose'
  | 'bottomInset'
>;

/**
 * Returns the ~8 standard props that every BottomSheetModal repeats.
 *
 * Usage:
 * ```tsx
 * const sheetDefaults = useSheetDefaults();
 * <BottomSheetModal ref={ref} {...sheetDefaults} snapPoints={['50%']}>
 * ```
 */
export const useSheetDefaults = (): SheetDefaults => {
  const themedTailwind = useThemedStyles();
  const bottomInset = useBottomSheetInset();

  return useMemo<SheetDefaults>(
    () => ({
      backdropComponent: BottomSheetBackdrop,
      handleIndicatorStyle: themedTailwind.style(
        'overflow-hidden bg-slate-8 w-8 h-1 rounded-[11px]',
      ),
      handleStyle: themedTailwind.style('p-0 h-4 pt-[5px]'),
      style: themedTailwind.style('rounded-[26px] overflow-hidden'),
      backgroundStyle: themedTailwind.style('bg-solid-1'),
      animationConfigs: spring.sheet,
      enablePanDownToClose: true,
      bottomInset,
    }),
    [themedTailwind, bottomInset],
  );
};
