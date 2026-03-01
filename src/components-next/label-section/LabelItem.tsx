import React from 'react';
import { Text } from 'react-native';
import { tailwind } from '@/theme';
import { useThemedStyles } from '@/hooks';
import { NativeView } from '@/components-next/native-components';

type LabelItemProps = {
  title: string;
  color: string;
};

export const LabelItem = ({ title, color }: LabelItemProps) => {
  const themedTailwind = useThemedStyles();
  return (
    <NativeView
      style={themedTailwind.style(
        'flex-row items-center gap-1 h-5 py-0.5 px-1 rounded border border-slate-6 bg-transparent',
      )}>
      <NativeView style={tailwind.style('h-2 w-2 rounded-sm', `bg-[${color}]`)} />
      <Text
        numberOfLines={1}
        style={themedTailwind.style('text-xs font-inter-420-20 text-slate-11')}>
        {title}
      </Text>
    </NativeView>
  );
};
