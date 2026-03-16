import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { TickIcon } from '@/svg-icons/common/TickIcon';
import { tailwind } from '@infrastructure/theme';

type SelectableListCellProps = {
  /** Content rendered to the left of the text row (Avatar, Icon, colored dot, etc.) */
  leftContent?: React.ReactNode;
  /** Primary label text */
  label: string;
  /** Whether this item is currently selected (shows TickIcon) */
  isSelected?: boolean;
  /** Whether this is the last item (hides bottom border) */
  isLastItem?: boolean;
  /** Press handler */
  onPress: () => void;
};

/**
 * A generic selectable list cell for bottom sheets and selection lists.
 *
 * Renders: [leftContent] | [label text .............. TickIcon?] | [border]
 *
 * The text row uses the standard padding/layout:
 * `flex-1 ml-3 flex-row justify-between py-[11px] pr-3`
 *
 * Used across filters, assignee pickers, team pickers, language lists, etc.
 */
export const SelectableListCell = ({
  leftContent,
  label,
  isSelected = false,
  isLastItem = false,
  onPress,
}: SelectableListCellProps) => {
  return (
    <Pressable onPress={onPress} style={tailwind.style('flex flex-row items-center')}>
      {leftContent}
      <Animated.View
        style={tailwind.style(
          'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
          !isLastItem ? 'border-b-[1px] border-slate-6' : '',
        )}>
        <Animated.Text
          style={tailwind.style(
            'text-base text-slate-12 font-inter-420-20 leading-[21px] tracking-[0.16px] capitalize',
          )}>
          {label}
        </Animated.Text>
        {isSelected ? <TickIcon size={20} color={tailwind.color('text-slate-12')} /> : null}
      </Animated.View>
    </Pressable>
  );
};
