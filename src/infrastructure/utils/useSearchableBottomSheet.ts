import { useCallback, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

type UseSearchableBottomSheetReturn = {
  /** Current search term */
  searchTerm: string;
  /** Pass to SearchBar's onChangeText or manage state externally */
  handleChangeText: (text: string) => void;
  /** Pass to SearchBar's onFocus — expands the sheet */
  handleFocus: () => void;
  /** Pass to SearchBar's onBlur — dismisses the sheet */
  handleBlur: () => void;
};

/**
 * Encapsulates the repeated pattern of search + bottom sheet expand/dismiss.
 *
 * When the search bar is focused, the sheet expands to full height.
 * When the search bar is blurred, the sheet dismisses.
 *
 * @param sheetRef - The BottomSheetModal ref to control
 */
export const useSearchableBottomSheet = (
  sheetRef: React.RefObject<BottomSheetModal | null>,
): UseSearchableBottomSheetReturn => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangeText = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handleFocus = useCallback(() => {
    sheetRef.current?.expand();
  }, [sheetRef]);

  const handleBlur = useCallback(() => {
    sheetRef.current?.dismiss({ overshootClamping: true });
  }, [sheetRef]);

  return { searchTerm, handleChangeText, handleFocus, handleBlur };
};
