import React, { useState } from 'react';
import { Text } from 'react-native';
import { tailwind } from '@/theme';
import { useThemedStyles } from '@/hooks';
import { AnimatedNativeView, NativeView } from '@/components-next/native-components';
import { Label } from '@/types';

interface LabelState {
  result: Label[]; // List of labels that fit within the available width
  totalWidth: number; // Total width of the labels added so far
}

interface LayoutChangeEvent {
  nativeEvent: {
    layout: {
      width: number; // Width of the component
      height: number; // Height of the component
    };
  };
}

const LabelPill = ({ labelText, labelColor }: { labelText: string; labelColor: string }) => {
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

export const LabelIndicator = ({ labels, allLabels }: { labels: string[]; allLabels: Label[] }) => {
  // Store the container width
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const activeLabels = React.useMemo(() => {
    if (!allLabels || !labels || containerWidth === null) return [];

    const availableWidth = containerWidth;

    const { result } = allLabels.reduce<LabelState>(
      (state, label) => {
        if (!labels.includes(label.title)) return state; // Skip labels not in `labels`

        // Approximate pill width: text chars * 7 + dot(8) + gaps(8) + padding(8) + border(2)
        const labelWidth = label.title.length * 7 + 26;

        if (state.totalWidth + labelWidth <= availableWidth) {
          // Add the label to the result and update the total width
          return {
            result: [...state.result, label],
            totalWidth: state.totalWidth + labelWidth + 4, // 4px gap between pills
          };
        }
        // Stop adding labels if the total width exceeds the available space
        return state;
      },
      { result: [], totalWidth: 0 }, // Start with an empty list and zero width
    );

    return result; // Return the list of active labels
  }, [allLabels, labels, containerWidth]);

  return (
    <AnimatedNativeView
      style={tailwind.style('flex-1')}
      onLayout={(event: LayoutChangeEvent) => {
        // Measure the container width when it is rendered
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}>
      <NativeView style={tailwind.style('flex-row items-center overflow-hidden gap-1')}>
        {activeLabels.map(label => (
          <LabelPill key={label.title} labelText={label.title} labelColor={label.color} />
        ))}
      </NativeView>
    </AnimatedNativeView>
  );
};
