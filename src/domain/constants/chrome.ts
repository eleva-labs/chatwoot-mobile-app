// src/domain/constants/chrome.ts
// App chrome geometry — plain numeric constants, no framework imports.

// ── Tab bar ──────────────────────────────────────────────────────────

/** Fixed content portion of the tab bar (icons + top padding).
 *  Derived from legacy TAB_BAR_HEIGHT (83) minus iOS safe-area allocation (32). */
export const TAB_BAR_CONTENT_HEIGHT = 51;

/** Minimum iOS bottom padding inside the tab bar footer.
 *  Reconciles the 32 used in useTabBarHeight() and the 34 used in BottomTabBar.
 *  Uses 34 — matching BottomTabBar's actual rendered value. */
export const IOS_TAB_BAR_BOTTOM_PADDING = 34;

// ── Android insets ───────────────────────────────────────────────────

/** Minimum Android system-navigation-bar inset applied as internal bottom padding.
 *  Used by BottomTabBar (via useChromeMetrics) and ReplyBoxContainer (via useEffectiveBottom).
 *  On edge-to-edge devices useSafeAreaInsets().bottom (~48dp) dominates via Math.max.
 *  On non-edge-to-edge devices (bottom=0) this provides a fallback. */
export const ANDROID_NAV_BAR_INSET = 8;

/** Small upward lift for the Android footer so the system nav bar gesture area
 *  doesn't occlude the bottom edge of the tab bar icons. */
export const ANDROID_FOOTER_LIFT = 6;

// ── Action tabs (bulk-select pill) ───────────────────────────────────

/** Height of the floating action pill (bulk-select actions). */
export const ACTION_TAB_HEIGHT = 58;

/** Gap between action pill bottom edge and footer top edge. */
export const ACTION_TABS_GAP = 8;

// Note: ANDROID_ACTION_TABS_BOTTOM_INSET (16) was removed — no longer needed
// now that the tab bar sits at bottom:0 on Android (action pill uses
// tabBarHeight + ACTION_TABS_GAP, same as iOS).
