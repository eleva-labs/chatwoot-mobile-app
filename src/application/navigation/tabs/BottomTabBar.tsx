import React, { PropsWithChildren } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView, BlurViewProps } from '@react-native-community/blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { selectCurrentState } from '@application/store/conversation/conversationHeaderSlice';

import {
  ConversationIconFilled,
  ConversationIconOutline,
  InboxIconFilled,
  InboxIconOutline,
  SettingsIconFilled,
  SettingsIconOutline,
} from '@/svg-icons';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import { useHaptic, useScaleAnimation, useTabBarHeight } from '@infrastructure/utils';

import { TabParamList } from './AppTabs';
import { useAppSelector, useThemedStyles } from '@/hooks';
import { useTheme } from '@infrastructure/context';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const tabExitSpringConfig = { damping: 20, stiffness: 360, mass: 1 };
const tabEnterSpringConfig = { damping: 30, stiffness: 360, mass: 1 };

type TabBarIconsProps = {
  focused: boolean;
  route: RouteProp<TabParamList, keyof TabParamList>;
};

const TabBarIcons = ({ focused, route }: TabBarIconsProps) => {
  const { semanticColors } = useThemeColors();

  // Focused: Use accent color (blue-9 in light, lighter blue in dark)
  // Unfocused: Use muted text color (slate-10)
  const iconColor = focused ? semanticColors.accent : semanticColors.textMuted;

  switch (route.name) {
    case 'Conversations':
      return focused ? (
        <ConversationIconFilled color={iconColor} size={28} />
      ) : (
        <ConversationIconOutline color={iconColor} size={28} />
      );
    case 'Inbox':
      return focused ? (
        <InboxIconFilled color={iconColor} size={28} />
      ) : (
        <InboxIconOutline color={iconColor} size={28} />
      );
    case 'Settings':
      return focused ? (
        <SettingsIconFilled color={iconColor} size={28} />
      ) : (
        <SettingsIconOutline color={iconColor} size={28} />
      );
  }
};

type TabBarBackgroundProps = BlurViewProps & PropsWithChildren;

const TabBarBackground = (props: TabBarBackgroundProps) => {
  const { children, style, blurAmount, blurType } = props;

  const currentState = useAppSelector(selectCurrentState);

  const tabBarHeight = useTabBarHeight();

  const derivedAnimatedState = useDerivedValue(() =>
    currentState === 'Select'
      ? withSpring(1, tabExitSpringConfig)
      : withSpring(0, tabEnterSpringConfig),
  );

  const animatedTabBarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(derivedAnimatedState.value, [0, 1], [0, tabBarHeight]),
        },
      ],
    };
  });

  return Platform.OS === 'ios' ? (
    <AnimatedBlurView {...{ blurAmount, blurType }} style={[style, animatedTabBarStyle]}>
      {children}
    </AnimatedBlurView>
  ) : (
    <Animated.View style={[style, animatedTabBarStyle]}>{children}</Animated.View>
  );
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
  const tabBarHeight = useTabBarHeight();
  const { isDark } = useTheme();
  const themedTailwind = useThemedStyles();

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
    <TabBarBackground
      blurAmount={25}
      blurType={isDark ? 'dark' : 'light'}
      style={Platform.select({
        ios: [
          themedTailwind.style(
            'flex flex-row absolute w-full bottom-0 pl-[72px] pr-[71px] pt-[11px] pb-8 bg-solid-1',
            `h-[${tabBarHeight}px]`,
          ),
        ],
        android: [
          themedTailwind.style(
            'flex flex-row absolute w-full bottom-0 pl-[72px] pr-[71px] py-[11px] bg-solid-1',
            `h-[${tabBarHeight}px]`,
          ),
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
    </TabBarBackground>
  );
};
