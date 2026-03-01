import React from 'react';
import { Text } from 'react-native';
import { tailwind } from '@/theme';
import { useThemedStyles } from '@/hooks';
import { NativeView } from '@/components-next/native-components';

type LabelPillProps = {
  labelText: string;
  labelColor: string;
};

export const LabelPill = ({ labelText, labelColor }: LabelPillProps) => {
  const themedTailwind = useThemedStyles();
  return (
    <NativeView
      style={themedTailwind.style(
        'flex-row items-center gap-1 h-5 py-0.5 px-1 rounded border border-slate-6 bg-transparent',
      )}>
      <NativeView style={tailwind.style('h-2 w-2 rounded-sm', `bg-[${labelColor}]`)} />
      <Text
        numberOfLines={1}
        style={themedTailwind.style('text-xs font-inter-420-20 text-slate-11')}>
        {labelText}
      </Text>
    </NativeView>
  );
};
