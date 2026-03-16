import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TAB_BAR_CONTENT_HEIGHT,
  IOS_TAB_BAR_BOTTOM_PADDING,
  ANDROID_NAV_BAR_INSET,
  ANDROID_FOOTER_LIFT,
  ACTION_TAB_HEIGHT,
  ACTION_TABS_GAP,
} from '@domain/constants/chrome';

export type ChromeMetrics = {
  /** Visual height of the tab bar (for the `height` style prop on BottomTabBar). */
  tabBarHeight: number;

  /** How far above the screen bottom the footer's TOP edge sits.
   *  iOS: tabBarHeight.  Android: tabBarHeight + ANDROID_FOOTER_LIFT. */
  footerTopFromBottom: number;

  /** Bottom content padding for tab-root screens so content doesn't hide behind footer. */
  contentBottomPadding: number;

  /** The `bottom` CSS value for the ActionTabs pill. */
  actionTabsBottomOffset: number;

  /** Height of the ActionTabs pill. */
  actionTabHeight: number;

  /** Bottom inset for footer positioning (the `bottom` style prop).
   *  iOS: 0.  Android: ANDROID_FOOTER_LIFT (small lift above nav bar). */
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

    // ── Footer bottom inset ──
    // iOS: 0 — footer sits flush at screen bottom, safe-area handled by paddingBottom.
    // Android: small lift so the system nav bar gesture area doesn't occlude icons.
    const footerBottomInset = Platform.select({
      ios: 0,
      android: ANDROID_FOOTER_LIFT,
    })!;

    // ── Footer top from bottom ──
    const footerTopFromBottom = tabBarHeight + footerBottomInset;

    // ── ActionTabs bottom offset ──
    // Pill floats ACTION_TABS_GAP above the tab bar top edge.
    const actionTabsBottomOffset = footerTopFromBottom + ACTION_TABS_GAP;

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
