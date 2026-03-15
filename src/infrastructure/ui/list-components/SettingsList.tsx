import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { CaretRight } from '@/svg-icons/common/CaretRight';

import { GenericListType } from '@domain/types';
import { Icon } from '@infrastructure/ui/common/icon';
import { useBoxShadow, useThemeColors } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';

type GenericListProps = {
  sectionTitle?: string;
  list: GenericListType[];
};

type ListItemProps = {
  listItem: GenericListType;
  index: number;
  isLastItem: boolean;
};

const ListItem = (props: ListItemProps) => {
  const { listItem, index, isLastItem } = props;
  const themedTailwind = useThemedStyles();
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={() => listItem.onPressListItem && listItem.onPressListItem()}
      key={index}
      style={({ pressed }) => [
        themedTailwind.style(
          pressed ? 'bg-slate-3' : '',
          index === 0 ? 'rounded-t-[13px]' : '',
          isLastItem ? 'rounded-b-[13px]' : '',
        ),
      ]}>
      <Animated.View style={themedTailwind.style('flex flex-row items-center pl-3')}>
        {listItem.icon ? (
          <Animated.View>
            <Icon icon={listItem.icon} size={24} />
          </Animated.View>
        ) : null}
        <Animated.View
          style={themedTailwind.style(
            'flex-1 flex-row items-center justify-between py-[11px]',
            listItem.icon ? 'ml-3' : '',
            !isLastItem ? 'border-b-[1px] border-b-slate-6' : '',
          )}>
          <Animated.View>
            <Animated.Text
              style={themedTailwind.style(
                'text-base font-inter-420-20 leading-[22px] tracking-[0.16px] text-slate-12',
              )}>
              {listItem.title}
            </Animated.Text>
          </Animated.View>
          <Animated.View style={themedTailwind.style('flex flex-row items-center pr-3')}>
            <Animated.Text
              style={themedTailwind.style(
                'text-base font-inter-normal-20 leading-[22px] tracking-[0.16px]',
                listItem.subtitleType === 'light' ? 'text-slate-12' : 'text-slate-12',
              )}>
              {listItem.subtitle}
            </Animated.Text>
            {listItem.hasChevron ? <CaretRight size={20} color={colors.slate[12]} /> : null}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const SettingsList = (props: GenericListProps) => {
  const { list, sectionTitle } = props;
  const themedTailwind = useThemedStyles();
  const cardShadow = useBoxShadow('card');

  return (
    <Animated.View>
      {sectionTitle ? (
        <Animated.View style={themedTailwind.style('pl-4 pb-3')}>
          <Animated.Text
            style={themedTailwind.style(
              'text-sm font-inter-medium-24 leading-[16px] tracking-[0.32px] text-slate-11',
            )}>
            {sectionTitle}
          </Animated.Text>
        </Animated.View>
      ) : null}
      <Animated.View
        style={[themedTailwind.style('rounded-[13px] mx-4 bg-solid-1'), { boxShadow: cardShadow }]}>
        {list.map(
          (listItem, index) =>
            !listItem.disabled && (
              <ListItem
                key={index}
                {...{ listItem, index }}
                isLastItem={index === list.length - 1}
              />
            ),
        )}
      </Animated.View>
    </Animated.View>
  );
};
