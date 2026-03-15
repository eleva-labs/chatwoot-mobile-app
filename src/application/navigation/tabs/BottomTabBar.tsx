import React from 'react';
import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

import {
  ConversationIconFilled,
  ConversationIconOutline,
  InboxIconFilled,
  InboxIconOutline,
  SettingsIconFilled,
  SettingsIconOutline,
} from '@/svg-icons';
import { tailwind, useBoxShadow, useThemeColors } from '@infrastructure/theme';
import { useHaptic, useScaleAnimation, useChromeMetrics } from '@infrastructure/utils';

import { TabParamList } from './AppTabs';
import { useThemedStyles } from '@/hooks';

type TabBarIconsProps = {
  focused: boolean;
  route: RouteProp<TabParamList, keyof TabParamList>;
};

const TabBarIcons = ({ focused, route }: TabBarIconsProps) => {
  const { colors, semanticColors } = useThemeColors();

  // Active: iris-11 provides high-contrast brand tint in both light/dark modes
  // Inactive: textSecondary (slate-11) provides readable contrast, matching web sidebar
  const iconColor = focused ? colors.iris[11] : semanticColors.textSecondary;

  switch (route.name) {
    case 'Conversations':
      return focused ? (
        <ConversationIconFilled color={iconColor} size={32} />
      ) : (
        <ConversationIconOutline color={iconColor} size={32} />
      );
    case 'Inbox':
      return focused ? (
        <InboxIconFilled color={iconColor} size={32} />
      ) : (
        <InboxIconOutline color={iconColor} size={32} />
      );
    case 'Settings':
      return focused ? (
        <SettingsIconFilled color={iconColor} size={32} />
      ) : (
        <SettingsIconOutline color={iconColor} size={32} />
      );
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabItem = (props: any) => {
  const { handlers, animatedStyle } = useScaleAnimation();

  const { onPress, onLongPress, isFocused, options, route } = props;

  // Memoize hitSlop to prevent new object reference on every render
  const hitSlop = React.useMemo(() => ({ top: 2, left: 10, right: 10, bottom: 10 }), []);

  // Use stable object reference for accessibilityState when not focused
  const accessibilityState = React.useMemo(
    () => (isFocused ? { selected: true } : {}),
    [isFocused],
  );
  return (
    <Animated.View
      style={[tailwind.style('justify-center items-center flex-1 bg-transparent'), animatedStyle]}>
      <Pressable
        hitSlop={hitSlop}
        style={tailwind.style(
          `h-12 w-12 items-center justify-center rounded-2xl ${isFocused ? 'bg-slate-6' : ''}`,
        )}
        {...handlers}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}>
        <TabBarIcons focused={isFocused} route={route} />
      </Pressable>
    </Animated.View>
  );
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const hapticSelection = useHaptic();
  const { tabBarHeight, footerBottomInset, bottomPadding } = useChromeMetrics();
  const themedTailwind = useThemedStyles();
  const cardShadow = useBoxShadow('card');

  // Memoize press handlers using useCallback
  const createPressHandler = React.useCallback(
    (route: { key: string; name: string; params?: object }, isFocused: boolean) => {
      return () => {
        hapticSelection?.();
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name, route.params);
        }
      };
    },
    [hapticSelection, navigation],
  );

  // Memoize long press handler
  const createLongPressHandler = React.useCallback(
    (route: { key: string; name: string; params?: object }) => {
      return () => {
        navigation.emit({
          type: 'tabLongPress',
          target: route.key,
        });
      };
    },
    [navigation],
  );

  return (
    <Animated.View
      style={Platform.select({
        ios: [
          themedTailwind.style(
            'flex flex-row absolute w-full bottom-0 pl-[72px] pr-[71px] pt-[12px] bg-solid-1',
          ),
          { height: tabBarHeight, paddingBottom: bottomPadding, boxShadow: cardShadow },
        ],
        android: [
          themedTailwind.style(
            'flex flex-row absolute w-full pl-[72px] pr-[71px] pt-[12px] bg-solid-1',
          ),
          {
            height: tabBarHeight,
            bottom: footerBottomInset,
            paddingBottom: bottomPadding,
            boxShadow: cardShadow,
          },
        ],
      })}>
      <Animated.View style={themedTailwind.style('absolute inset-0 h-[1px] bg-slate-6')} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        return (
          <TabItem
            key={route.key}
            options={options}
            onPress={createPressHandler(route, isFocused)}
            onLongPress={createLongPressHandler(route)}
            route={route}
            isFocused={isFocused}
          />
        );
      })}
    </Animated.View>
  );
};
