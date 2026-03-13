import React from 'react';
import Animated from 'react-native-reanimated';

import i18n from '@infrastructure/i18n';
import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';

export const SettingsHeader = () => {
  const themedTailwind = useThemedStyles();
  return (
    <Animated.View style={themedTailwind.style('bg-solid-1')}>
      <Animated.View style={tailwind.style('flex flex-row px-4 pt-4 pb-5')}>
        <Animated.View style={tailwind.style('flex-1 justify-center items-center')}>
          <Animated.Text
            style={themedTailwind.style(
              'text-[21px] font-medium text-center leading-[26px] text-slate-12',
            )}>
            {i18n.t('SETTINGS.HEADER_TITLE')}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
