import React from 'react';
import { Text } from 'react-native';

import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { NativeView } from '@infrastructure/ui/native-components';

type TypingMessageProps = {
  typingText: string;
};

export const TypingMessage = (props: TypingMessageProps) => {
  const { typingText } = props;
  const themedTailwind = useThemedStyles();
  return (
    <NativeView style={tailwind.style('flex-1 flex-row gap-1 items-start')}>
      <Text
        numberOfLines={1}
        style={themedTailwind.style('text-sm flex-1 font-inter-420-20 leading-6 text-teal-11')}>
        {typingText}
      </Text>
    </NativeView>
  );
};
