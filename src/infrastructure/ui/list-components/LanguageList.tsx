import React from 'react';
import Animated from 'react-native-reanimated';

import { LANGUAGES } from '@domain/constants';
import { useThemedStyles } from '@infrastructure/hooks';
import { useHaptic } from '@infrastructure/utils';
import { SelectableListCell } from './SelectableListCell';

export type LanguageItemType = {
  title: string;
  key: string;
};

const languagesList = Object.keys(LANGUAGES).map(languageCode => {
  return {
    title: LANGUAGES[languageCode as keyof typeof LANGUAGES],
    key: languageCode,
  };
});

export const LanguageList = ({
  currentLanguage,
  onChangeLanguage,
}: {
  currentLanguage: string;
  onChangeLanguage: (locale: string) => void;
}) => {
  const themedTailwind = useThemedStyles();
  const hapticSelection = useHaptic();
  return (
    <Animated.View style={themedTailwind.style('pt-1 pb-4 pl-2')}>
      {languagesList.map((item, index) => (
        <SelectableListCell
          key={item.key}
          label={item.title}
          isSelected={currentLanguage === item.key}
          isLastItem={index === languagesList.length - 1}
          onPress={() => {
            hapticSelection?.();
            onChangeLanguage(item.key);
          }}
        />
      ))}
    </Animated.View>
  );
};
