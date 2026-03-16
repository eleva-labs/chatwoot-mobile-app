import React, { useCallback, useState } from 'react';

import { BottomSheetHeader, SearchBar } from '@infrastructure/ui';
import { LabelStack } from '@infrastructure/ui/label-section';
import { useAppSelector } from '@application/store/hooks';
import { filterLabels } from '@application/store/label/labelSelectors';
import i18n from '@infrastructure/i18n';

type LabelPickerProps = {
  /** Currently selected label titles */
  selectedLabels: string[];
  /** Called when a label is toggled on/off */
  onToggleLabel: (labelTitle: string) => void;
  /** Called when search bar focuses (e.g., to expand the sheet) */
  onSearchFocus?: () => void;
  /** Called when search bar blurs */
  onSearchBlur?: () => void;
};

export const LabelPicker = (props: LabelPickerProps) => {
  const { selectedLabels, onToggleLabel, onSearchFocus, onSearchBlur } = props;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLabels = useAppSelector(state => filterLabels(state, searchTerm));

  const handleChangeText = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  return (
    <React.Fragment>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.ACTIONS.LABELS.TITLE')} />
      <SearchBar
        isInsideBottomSheet
        onFocus={onSearchFocus}
        onBlur={onSearchBlur}
        onChangeText={handleChangeText}
        placeholder={i18n.t('CONVERSATION.ASSIGNEE.LABELS.SEARCH_LABELS')}
      />
      <LabelStack
        labels={filteredLabels}
        selectedLabels={selectedLabels}
        onLabelPress={onToggleLabel}
      />
    </React.Fragment>
  );
};
