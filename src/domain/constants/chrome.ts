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

/** Minimum Android system-navigation-bar inset — how far the footer floats
 *  above the system nav bar. Shared between BottomTabBar and ReplyBoxContainer. */
export const ANDROID_NAV_BAR_INSET = 8;

// ── Action tabs (bulk-select pill) ───────────────────────────────────

/** Height of the floating action pill (bulk-select actions). */
export const ACTION_TAB_HEIGHT = 58;

/** Gap between action pill bottom edge and footer top edge. */
export const ACTION_TABS_GAP = 8;

/** Minimum Android bottom inset for action pill positioning.
 *  Larger than ANDROID_NAV_BAR_INSET (16 vs 8) because the pill needs
 *  more clearance above the nav bar than the footer does. */
// TODO: CommandOptionsMenu.tsx has a similar hardcoded `16` that could be
// migrated to use this constant in a follow-up.
export const ANDROID_ACTION_TABS_BOTTOM_INSET = 16;
