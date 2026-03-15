import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TAB_BAR_CONTENT_HEIGHT,
  IOS_TAB_BAR_BOTTOM_PADDING,
  ANDROID_NAV_BAR_INSET,
  ACTION_TAB_HEIGHT,
  ACTION_TABS_GAP,
  ANDROID_ACTION_TABS_BOTTOM_INSET,
} from '@domain/constants/chrome';

export type ChromeMetrics = {
  /** Visual height of the tab bar (for the `height` style prop on BottomTabBar). */
  tabBarHeight: number;

  /** How far above the screen bottom the footer's TOP edge sits.
   *  iOS: equals tabBarHeight (footer at bottom:0).
   *  Android: tabBarHeight + bottom offset (footer floats above nav bar). */
  footerTopFromBottom: number;

  /** Bottom content padding for tab-root screens so content doesn't hide behind footer. */
  contentBottomPadding: number;

  /** The `bottom` CSS value for the ActionTabs pill. */
  actionTabsBottomOffset: number;

  /** Height of the ActionTabs pill. */
  actionTabHeight: number;

  /** Bottom inset for footer positioning.
   *  iOS: 0 (footer sits at bottom:0 with internal padding).
   *  Android: max(safeArea, ANDROID_NAV_BAR_INSET) to float above system nav bar. */
  footerBottomInset: number;

  /** Internal bottom padding of the tab bar (below icons).
   *  iOS: max(safeArea, IOS_TAB_BAR_BOTTOM_PADDING).
   *  Android: max(safeArea, ANDROID_NAV_BAR_INSET). */
  bottomPadding: number;
};

export const useChromeMetrics = (): ChromeMetrics => {
  const { bottom } = useSafeAreaInsets();

  return useMemo(() => {
    // ── Platform-specific bottom padding inside the tab bar ──
    const bottomPadding = Platform.select({
      ios: Math.max(bottom, IOS_TAB_BAR_BOTTOM_PADDING),
      android: Math.max(bottom, ANDROID_NAV_BAR_INSET),
    })!;

    // ── Tab bar visual height ──
    // This is the `height` style prop, NOT including Android's external bottom offset.
    const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomPadding;
    // iOS: 51 + max(bottom, 34) — typically 85 on notched iPhones
    // Android: 51 + max(bottom, 8) — forward-compatible with edge-to-edge

    // ── Android bottom offset ──
    // Footer additionally uses `bottom: max(bottom, 8)` to float above the nav bar.
    const androidBottomOffset = Math.max(bottom, ANDROID_NAV_BAR_INSET);

    // ── Footer bottom inset ──
    const footerBottomInset = Platform.select({
      ios: 0,
      android: androidBottomOffset,
    })!;

    // ── Footer top from bottom ──
    const footerTopFromBottom = Platform.select({
      ios: tabBarHeight,
      android: tabBarHeight + androidBottomOffset,
    })!;
    // iOS: ~85. Android: 59 + 8 = 67.

    // ── ActionTabs bottom offset ──
    const actionTabsBottomOffset = Platform.select({
      ios: tabBarHeight + ACTION_TABS_GAP,
      android: tabBarHeight + Math.max(bottom, ANDROID_ACTION_TABS_BOTTOM_INSET) + ACTION_TABS_GAP,
    })!;

    // ── Content bottom padding ──
    const contentBottomPadding = footerTopFromBottom;

    return {
      tabBarHeight,
      footerTopFromBottom,
      contentBottomPadding,
      actionTabsBottomOffset,
      actionTabHeight: ACTION_TAB_HEIGHT,
      footerBottomInset,
      bottomPadding,
    };
  }, [bottom]);
};
