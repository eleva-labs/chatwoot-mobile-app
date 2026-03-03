import React from 'react';
import { View, Text } from 'react-native';
import { tailwind } from '@infrastructure/theme';
import i18n from '@infrastructure/i18n';

export const UnsupportedBubble = () => {
  return (
    <View
      style={tailwind.style(
        'px-4 py-3 bg-solid-amber border border-dashed border-amber-12 rounded-lg',
      )}>
      <Text style={tailwind.style('text-slate-12')}>
        {i18n.t('CONVERSATION.UNSUPPORTED_MESSAGE')}
      </Text>
    </View>
  );
};
