# Styling Architecture

This document defines how styling works in the Chatwoot mobile app. It is the single reference for developers and AI agents working on any part of the UI.

## Table of Contents

1. [Overview](#1-overview)
2. [Color System](#2-color-system)
3. [Tailwind Integration](#3-tailwind-integration)
4. [Theme Providers and Hooks](#4-theme-providers-and-hooks)
5. [Design Tokens Pattern](#5-design-tokens-pattern)
6. [Typography](#6-typography)
7. [Dark Mode](#7-dark-mode)
8. [Patterns to Follow](#8-patterns-to-follow)
9. [Patterns to Avoid](#9-patterns-to-avoid)
10. [Web Alignment](#10-web-alignment)

---

## 1. Overview

The mobile app uses a unified styling system built on three layers:

1. **Radix 12-step color scales** -- 7 color families with 12 steps each, ported from the web app's `_next-colors.scss`. The same RGB values are used on both platforms.
2. **twrnc (Tailwind React Native Classnames)** -- Tailwind-style utility classes applied to React Native views via `tailwind.style()`.
3. **Semantic tokens** -- Named mappings (`background`, `solid-1`, `border-weak`) that resolve to different values per theme mode.

This system is designed so that a single Tailwind class like `bg-slate-3` resolves to the correct color in both light and dark mode, without any conditional logic in the component.

### Key files

| File | Role |
|------|------|
| `src/theme/colors/unified.ts` | Radix 12-step scales (light + dark) for all 7 families |
| `src/theme/colors/brand.ts` | Brand color `#5d17ea` and related constants |
| `src/theme/colors/semantic.ts` | Semantic tokens (surfaces, borders, overlays) |
| `src/theme/tailwind.config.ts` | `buildTwConfig(isDark)` -- assembles the twrnc config |
| `src/theme/tailwind.ts` | Mutable singleton + `rebuildTailwind(isDark)` |
| `src/theme/components/ThemeProvider.tsx` | Unified provider -- manages state, rebuilds tailwind |
| `src/theme/text-styles.ts` | Typography presets |
| `src/theme/index.ts` | Barrel exports |

---

## 2. Color System

### 2.1 Radix 12-Step Scale

Every color family has 12 steps. Each step has a defined semantic role:

| Steps | Role | Common Usage |
|-------|------|-------------|
| 1--2 | Backgrounds | `bg-slate-1` (app bg), `bg-slate-2` (subtle bg) |
| 3--5 | Component surfaces | `bg-slate-3` (card bg), `bg-slate-4` (hover), `bg-slate-5` (active) |
| 6--8 | Borders | `border-slate-6` (subtle), `border-slate-7` (default), `border-slate-8` (strong/focus) |
| 9--10 | Solids | `bg-iris-9` (button fill), `bg-iris-10` (button hover) |
| 11--12 | Text | `text-slate-11` (secondary text), `text-slate-12` (primary text) |

This scale is from the Radix UI color system. Steps 11--12 are designed to meet APCA contrast requirements on step 1--2 backgrounds.

### 2.2 Color Families

| Family | Role | Step 9 (solid) | Example Usage |
|--------|------|---------------|--------------|
| **slate** | Neutral (blue-tinted gray) | `rgb(139,141,152)` | Text, backgrounds, borders |
| **iris** | Primary interactive | `rgb(91,91,214)` / `#5B5BD6` | Buttons, links, focus rings |
| **blue** | Info / accent | `rgb(39,129,246)` | Info badges, link text |
| **ruby** | Error / destructive | `rgb(229,70,102)` | Error states, delete actions |
| **amber** | Warning | `rgb(255,197,61)` | Warning banners |
| **teal** | Success | `rgb(18,165,148)` | Success states, online indicators |
| **gray** | Pure neutral (no blue tint) | `rgb(141,141,141)` | Secondary neutral where slate feels too blue |

All 7 families are defined in `src/theme/colors/unified.ts` with separate light and dark mode objects (`lightModeColorScales` / `darkModeColorScales`).

### 2.3 Brand Color

The brand color is `#5d17ea` -- a vivid electric purple. It is **not** the same as `iris-9` (`#5B5BD6`).

```
brand:      #5d17ea  -- Logo, primary CTAs, brand elements
lightBrand: #f9f8fc  -- Brand text on dark backgrounds
iris-9:     #5B5BD6  -- Interactive UI (buttons, toggles, focus rings)
```

Defined in `src/theme/colors/brand.ts`. The brand value does not change between light and dark mode. When displaying brand-colored text on a dark background, use `lightBrand` instead.

### 2.4 Semantic Colors

Semantic tokens map named concepts to specific color values per mode. Defined in `src/theme/colors/semantic.ts`:

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|---------------|
| `background` | `rgb(253,253,253)` | `rgb(18,18,19)` | `bg-background` |
| `solid-1` | `rgb(255,255,255)` | `rgb(23,23,26)` | `bg-solid-1` |
| `solid-2` | `rgb(255,255,255)` | `rgb(29,30,36)` | `bg-solid-2` |
| `solid-3` | `rgb(255,255,255)` | `rgb(44,45,54)` | `bg-solid-3` |
| `borderWeak` | `rgb(234,234,234)` | `rgb(38,38,42)` | `border-weak` |
| `borderStrong` | `rgb(235,235,235)` | `rgb(52,52,52)` | `border-strong` |
| `borderContainer` | `rgb(236,236,236)` | `transparent` | `border-container` |
| `alpha-1` | `rgba(67,67,67,0.06)` | `rgba(36,36,36,0.8)` | `bg-alpha-1` |
| `alpha-2` | `rgba(201,202,207,0.15)` | `rgba(139,147,182,0.15)` | `bg-alpha-2` |
| `textBlue` | `rgb(8,109,224)` | `rgb(126,182,255)` | `text-blue-text` |

Note: `border-strong` and `border-slate-7` are different values. `border-strong` comes from the `--border-strong` CSS variable; `border-slate-7` is the Radix step 7 value. Use the one that matches your intent.

### 2.5 Light vs Dark Mode Scales

Light and dark are **separate, independent scales** -- not a simple inversion. For example, slate-12 is near-black in light mode (`rgb(28,32,36)`) and near-white in dark mode (`rgb(237,238,240)`). The step numbers represent semantic function (step 12 = highest contrast text), not absolute lightness.

Step 9 (the solid/accent step) stays the same RGB in both modes for most families. The surrounding steps shift to maintain contrast against the mode's background.

---

## 3. Tailwind Integration

### 3.1 twrnc Library

The app uses [twrnc](https://github.com/jaredh159/twrnc) -- a runtime Tailwind CSS engine for React Native. It translates Tailwind class strings into React Native style objects.

```typescript
import { tailwind } from '@/theme';

// Returns a React Native style object: { backgroundColor: 'rgb(240,240,243)', padding: 16 }
tailwind.style('bg-slate-3 p-4')

// Get a resolved color string for native props
tailwind.color('text-slate-11')  // => 'rgb(96,100,108)'
```

### 3.2 The Mutable Singleton Pattern

The tailwind instance is a module-level mutable variable. When the theme changes, it is rebuilt with the new color palette. All importers see the updated instance because ES module named exports are live bindings.

**`src/theme/tailwind.ts`:**

```typescript
import { create } from 'twrnc';
import { buildTwConfig } from './tailwind.config';

let _tailwind = create(buildTwConfig(false)); // starts as light

export const rebuildTailwind = (isDark: boolean) => {
  _tailwind = create(buildTwConfig(isDark));
};

// ES module live binding -- importers always get the current _tailwind
export { _tailwind as tailwind };
```

### 3.3 buildTwConfig(isDark)

The `buildTwConfig` function in `src/theme/tailwind.config.ts` creates a complete twrnc configuration for a single mode. It loads only the active mode's Radix scales and semantic colors:

```typescript
export const buildTwConfig = (isDark: boolean) => {
  const radixScales = getRadixScales(isDark);      // from unified.ts
  const semanticColors = getSemanticColors(isDark); // from semantic.ts

  return {
    theme: {
      extend: {
        colors: {
          slate: radixScales.slate,
          iris: radixScales.iris,
          // ... all 7 families
          brand: brandColors.brand,
          background: semanticColors.background,
          'solid-1': semanticColors.solid1,
          // ... all semantic tokens
        },
        fontFamily: { /* Inter variants */ },
        fontSize: { xs: '12px', cxs: '13px', md: '15px', '2xl': '22px' },
      },
    },
  };
};
```

Only the active mode's colors are loaded. This means `bg-slate-3` resolves to the light value when light mode is active and the dark value when dark mode is active -- no conditional logic needed.

### 3.4 Using tailwind.style()

```typescript
import { tailwind } from '@/theme';

// Single class string with multiple utilities
<View style={tailwind.style('bg-slate-1 border border-slate-6 rounded-xl p-4')}>
  <Text style={tailwind.style('text-slate-12 text-base font-inter-420-20')}>
    Hello
  </Text>
</View>

// Combining multiple class strings (useful with token objects)
<View style={tailwind.style(tokens.background, 'rounded-xl p-3')}>

// Conditional classes
<View style={tailwind.style('p-4', isActive && 'bg-iris-3')}>
```

### 3.5 Using tailwind.color()

For native component props that require a color string (not a style object):

```typescript
<ActivityIndicator color={tailwind.color('text-slate-9')} />
<Icon stroke={tailwind.color('text-slate-11')} />
<StatusBar backgroundColor={tailwind.color('bg-slate-1')} />
```

---

## 4. Theme Providers and Hooks

### 4.1 ThemeProvider

A single unified provider at `src/theme/components/ThemeProvider.tsx` manages all theme state. It:

1. Reads the system color scheme via `useColorScheme()`
2. Resolves `isDark` from the user's preference (`light` / `dark` / `system`)
3. Calls `rebuildTailwind(isDark)` when `isDark` changes
4. Increments `themeVersion` to trigger re-renders
5. Provides Radix color scales and semantic colors via context

```typescript
export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  isDark: boolean;
  colors: UnifiedColorScale;       // Radix scales for active mode
  semanticColors: SemanticColors;   // Semantic tokens for active mode
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  themeVersion: number;             // Monotonically increasing counter
}
```

### 4.2 Hooks

**`useTheme()`** -- the primary hook. Returns the full `ThemeContextType`.

```typescript
import { useTheme } from '@/theme';
const { isDark, colors, semanticColors, themeVersion } = useTheme();
```

**`useThemeColors()`** -- convenience hook returning only `{ colors, semanticColors }`.

```typescript
import { useThemeColors } from '@/theme';
const { colors, semanticColors } = useThemeColors();
```

**`useThemeState()`** -- convenience hook returning only `{ isDark, toggleTheme, setTheme }`.

**`useThemedStyles()`** -- legacy hook at `src/hooks/useThemedStyles.ts`. Returns `{ style, color }` methods that delegate to the tailwind singleton. Uses `themeVersion` as a dependency to invalidate on theme change. Used by ~44 files. No regex -- all class resolution is handled by the rebuilt tailwind instance.

```typescript
import { useThemedStyles } from '@/hooks';
const { style, color } = useThemedStyles();

<View style={style('bg-slate-3 p-4')}>
```

### 4.3 Legacy re-exports

`src/context/ThemeContext.tsx` re-exports `ThemeProvider` and `useTheme` from the unified provider for backward compatibility. ~170+ files import from this path.

### 4.4 themeVersion for cache invalidation

The `themeVersion` counter increments each time `rebuildTailwind` is called. Components that cache style results (via `useMemo`) should include `themeVersion` in their dependency arrays to ensure they re-compute after a theme change.

---

## 5. Design Tokens Pattern

For complex features with role-based or state-based styling, define feature-specific tokens that map semantic names to Tailwind classes.

### 5.1 Token Definition

Tokens live co-located with their feature: `src/presentation/styles/<feature>/tokens.ts`.

The AI assistant tokens (`src/presentation/styles/ai-assistant/tokens.ts`) are the canonical example:

```typescript
// Message bubble tokens by role
export const aiMessageTokens = {
  user: {
    background: 'bg-iris-3',
    text: 'text-iris-12',
    border: 'border-iris-6',
  },
  assistant: {
    background: 'bg-slate-3',
    text: 'text-slate-12',
    border: 'border-slate-6',
  },
};

// Collapsible tokens by accent color (iris, slate, teal, ruby, amber)
export const aiCollapsibleTokens = {
  iris: {
    border: 'border-slate-6',
    borderAccent: 'border-l-iris-9',
    background: 'bg-slate-3/50',
    iconActive: 'text-iris-9',
    labelActive: 'text-iris-11',
    // ...
  },
  // ... other accents
};
```

Token values are Tailwind class strings. They reference Radix scale steps by their semantic role (step 3 for backgrounds, step 6 for borders, step 9 for solid accents, step 11-12 for text).

### 5.2 Styles Hook

Each feature with tokens has a `use<Feature>Styles.ts` hook that combines `useThemedStyles` with the token objects:

```typescript
// src/presentation/styles/ai-assistant/useAIStyles.ts
export const useAIStyles = (): AIStylesResult => {
  const themedStyles = useThemedStyles();

  return useMemo(() => ({
    style: themedStyles.style,
    tokens: {
      message: aiMessageTokens,
      text: aiTextTokens,
      tool: aiToolTokens,
      // ...
    },
    message: getMessageTokens,       // (role) => tokens
    getCollapsible: getCollapsibleTokens, // (accent) => tokens
    getCursor: getCursorToken,
    getTextColor: getTextColorByRole,
  }), [themedStyles.style]);
};
```

### 5.3 Usage in Components

```typescript
import { useAIStyles } from '@/presentation/styles/ai-assistant';

const { style, message, getCollapsible } = useAIStyles();
const msgTokens = message('assistant');

<View style={style(msgTokens.background, 'rounded-2xl p-3')}>
  <Text style={style(msgTokens.text)}>{content}</Text>
</View>
```

### 5.4 When to Use Tokens

| Situation | Approach |
|-----------|----------|
| Simple view with a few colors | Direct `tailwind.style('bg-slate-1 text-slate-12')` |
| Need `isDark` for platform logic (StatusBar) | `useTheme()` hook |
| Complex feature with role/state-based styling | Define tokens + styles hook |

---

## 6. Typography

### 6.1 Inter Font Family

The app uses the Inter font with five static variants (React Native requires pre-compiled font files, not variable fonts):

| Tailwind Class | Weight | Optical Size | Usage |
|---------------|--------|-------------|-------|
| `font-inter-normal-20` | 400 (Regular) | 20 | Body text |
| `font-inter-420-20` | 420 (Book) | 20 | Slightly heavier body (84 occurrences) |
| `font-inter-medium-24` | 500 (Medium) | 24 | Headings, labels |
| `font-inter-580-24` | 580 (Semi-bold narrow) | 24 | Strong headings, display |
| `font-inter-semibold-20` | 600 (Semi-bold) | 20 | Emphasis, buttons |

The optical size suffix (20, 24) is part of the font file name. Weight 420 is an intentional design choice for improved mobile readability.

### 6.2 Typography Presets

Defined in `src/theme/text-styles.ts`. Use these instead of ad-hoc font class combinations:

```typescript
import { textStyles } from '@/theme/text-styles';

tailwind.style(textStyles.h1, 'text-slate-12')    // 20px, Inter-580-24
tailwind.style(textStyles.body, 'text-slate-12')   // 15px, Inter-400-20
tailwind.style(textStyles.caption, 'text-slate-11') // 12px, Inter-400-20
tailwind.style(textStyles.label, 'text-slate-12')  // 14px, Inter-500-24
```

Available presets: `display`, `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`, `captionXs`, `label`, `overline`.

### 6.3 Font Size Scale

| Class | Size | Note |
|-------|------|------|
| `text-xs` | 12px | Captions, timestamps |
| `text-cxs` | 13px | Custom -- small body |
| `text-sm` | 14px | Secondary body, labels |
| `text-md` | 15px | Custom -- alternative body |
| `text-base` | 16px | Primary body text |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 22px | Screen titles |

`text-cxs`, `text-md`, and `text-2xl` are custom sizes added in the tailwind config.

---

## 7. Dark Mode

### 7.1 End-to-End Flow

```
User toggles theme  (or system preference changes)
        |
        v
ThemeProvider detects isDark change
        |
        v
rebuildTailwind(isDark) called
  -> creates new twrnc instance with correct color palette
  -> _tailwind module variable reassigned
        |
        v
themeVersion incremented (setState)
        |
        v
Context consumers re-render
  -> useThemedStyles() invalidates (themeVersion in deps)
  -> tailwind.style() calls resolve to new colors
        |
        v
UI reflects new theme
```

### 7.2 Why Components Do Not Need dark: Prefixes

Unlike the web app (which uses Tailwind's `dark:` variant), the mobile app swaps the entire color palette. The class `bg-slate-3` resolves to light values when the light palette is loaded and dark values when the dark palette is loaded. No `dark:` prefix exists in twrnc.

This means most components need zero theme-related conditional logic:

```typescript
// This works correctly in both light and dark mode:
<View style={tailwind.style('bg-slate-1 border-slate-6 rounded-xl p-4')}>
  <Text style={tailwind.style('text-slate-12')}>Content</Text>
</View>
```

### 7.3 When You Still Need isDark

Use `isDark` only for things that cannot be expressed as Tailwind classes:

- **StatusBar style**: `barStyle={isDark ? 'light-content' : 'dark-content'}`
- **Third-party props**: Libraries requiring explicit light/dark configuration
- **Brand text on dark backgrounds**: `isDark ? 'text-lightBrand' : 'text-brand'`
- **Asset swapping**: Different images or icons per mode
- **Keyboard appearance**: `keyboardAppearance={isDark ? 'dark' : 'light'}`

```typescript
import { useTheme } from '@/theme';
const { isDark } = useTheme();
```

---

## 8. Patterns to Follow

### 8.1 New Simple Component

```typescript
import { tailwind } from '@/theme';
import { textStyles } from '@/theme/text-styles';

export const MyCard = ({ title, subtitle }: Props) => (
  <View style={tailwind.style('bg-slate-1 border border-slate-6 rounded-xl p-4')}>
    <Text style={tailwind.style(textStyles.h2, 'text-slate-12')}>{title}</Text>
    <Text style={tailwind.style(textStyles.bodySmall, 'text-slate-11 mt-1')}>
      {subtitle}
    </Text>
  </View>
);
```

### 8.2 Component Needing isDark

```typescript
import { useTheme } from '@/theme';
import { tailwind } from '@/theme';

export const MyScreen = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={tailwind.style('bg-slate-1 flex-1')}>
        {/* content */}
      </View>
    </>
  );
};
```

### 8.3 New Feature with Tokens

1. Create `src/presentation/styles/<feature>/tokens.ts`:

```typescript
export const featureTokens = {
  card: {
    background: 'bg-slate-3',
    border: 'border-slate-6',
    title: 'text-slate-12',
    subtitle: 'text-slate-11',
  },
  active: {
    background: 'bg-iris-3',
    border: 'border-iris-6',
    title: 'text-iris-12',
    indicator: 'bg-iris-9',
  },
};
```

2. Create `src/presentation/styles/<feature>/use<Feature>Styles.ts`:

```typescript
import { useMemo } from 'react';
import { useThemedStyles } from '@/hooks';
import { featureTokens } from './tokens';

export const useFeatureStyles = () => {
  const { style } = useThemedStyles();
  return useMemo(() => ({ style, tokens: featureTokens }), [style]);
};
```

3. Use in components:

```typescript
const { style, tokens } = useFeatureStyles();
<View style={style(tokens.card.background, tokens.card.border, 'rounded-xl p-4')}>
```

### 8.4 Native Color Props

Use `tailwind.color()` for props that take a color string:

```typescript
<ActivityIndicator color={tailwind.color('text-iris-9')} />
<Icon stroke={tailwind.color('text-slate-11')} />
```

### 8.5 Radix Step Selection Guide

When choosing a step for a new element:

| Element | Recommended Step | Class Example |
|---------|-----------------|---------------|
| Page background | 1 | `bg-slate-1` |
| Card/section background | 2 or 3 | `bg-slate-3` |
| Hover state | 4 | `bg-slate-4` |
| Pressed state | 5 | `bg-slate-5` |
| Divider/separator | 6 | `border-slate-6` |
| Input/card border | 7 | `border-slate-7` |
| Focus ring | 8 | `border-iris-8` |
| Button fill / badge | 9 | `bg-iris-9` |
| Button hover fill | 10 | `bg-iris-10` |
| Secondary text / labels | 11 | `text-slate-11` |
| Primary text / headings | 12 | `text-slate-12` |

---

## 9. Patterns to Avoid

### 9.1 Hardcoded hex colors in components

```typescript
// BAD
color="#5B5BD6"
stroke="#858585"
backgroundColor={Platform.OS === 'ios' ? '#4B5563' : '#9CA3AF'}

// GOOD
color={tailwind.color('text-iris-9')}
stroke={tailwind.color('text-slate-9')}
```

### 9.2 Using iris-9 for brand

`iris-9` (`#5B5BD6`) is the primary interactive color for UI elements. The brand color is `#5d17ea`. They are different purples.

```typescript
// BAD -- using iris-9 where brand is intended
<View style={tailwind.style('bg-iris-9')}>  // for a brand CTA

// GOOD
<View style={tailwind.style('bg-brand')}>
```

### 9.3 Using isDark ternaries for colors

If you are choosing between two colors based on dark mode, you probably need a Radix class instead:

```typescript
// BAD
isDark ? 'bg-gray-900' : 'bg-white'

// GOOD
'bg-slate-1'  // automatically resolves per mode
```

### 9.4 Legacy HSL scale names in new code

The legacy scales (`bg-gray-950`, `text-gray-700`, `bg-white`, `border-gray-200`) are from the old system and do not auto-switch with the theme. Use Radix equivalents:

| Legacy | Radix Equivalent |
|--------|-----------------|
| `bg-white` | `bg-solid-1` or `bg-background` |
| `bg-gray-50` | `bg-slate-2` |
| `bg-gray-100` | `bg-slate-3` |
| `text-gray-950` / `text-gray-900` | `text-slate-12` |
| `text-gray-700` / `text-gray-800` | `text-slate-11` |
| `text-gray-400` | `text-slate-9` |
| `border-gray-200` | `border-slate-6` |
| `border-gray-300` | `border-slate-7` |

### 9.5 Arbitrary border radius values

```typescript
// BAD
'rounded-[13px]'
'rounded-[26px]'

// GOOD -- use the standard scale
'rounded-xl'   // 12px
'rounded-2xl'  // 16px
'rounded-full'  // 9999px
```

### 9.6 Ad-hoc typography

```typescript
// BAD -- recreating a preset manually
'text-lg font-inter-medium-24 leading-6'

// GOOD -- use the preset
textStyles.h2
```

---

## 10. Web Alignment

### 10.1 Source of Truth

The mobile app's Radix color values are ported from the web app's `_next-colors.scss` (located at `chatwoot/app/javascript/dashboard/assets/scss/_next-colors.scss`). Every RGB triplet in `src/theme/colors/unified.ts` matches the web's CSS custom properties exactly.

### 10.2 Class Name Mapping

The web uses an `n-` namespace prefix; the mobile app does not:

| Web Class | Mobile Class |
|-----------|-------------|
| `text-n-slate-12` | `text-slate-12` |
| `bg-n-solid-1` | `bg-solid-1` |
| `bg-n-brand` | `bg-brand` |
| `bg-n-alpha-2` | `bg-alpha-2` |
| `border-n-weak` | `border-weak` |
| `outline-n-container` | `border-container` |
| `bg-n-background` | `bg-background` |
| `text-n-blue-text` | `text-blue-text` |

### 10.3 Key Differences from Web

1. **No `dark:` prefix.** The web uses `dark:bg-n-solid-3` for explicit dark-mode overrides. The mobile app swaps the entire palette instead. For cases where the web uses a different semantic choice in dark mode (e.g., `bg-n-slate-2 dark:bg-n-solid-2`), the mobile app should capture this as a semantic token or use `isDark`.

2. **Brand text switching.** The web pattern `text-n-brand dark:text-n-lightBrand` has no direct mobile equivalent. Use `isDark ? 'text-lightBrand' : 'text-brand'` or create a semantic token that switches value per mode.

3. **CSS variables do not exist in React Native.** The web's auto-switching via CSS custom properties is replaced by the `rebuildTailwind(isDark)` mechanism.

### 10.4 Adding a New Color from Web

1. Check if it exists in the 7 Radix families (84 light values + 84 dark values in `unified.ts`). If yes, use it directly.
2. If it is a semantic token from `_next-colors.scss` (e.g., `--solid-*`, `--border-*`, `--alpha-*`), add it to `src/theme/colors/semantic.ts` with both light and dark values.
3. Register it in `buildTwConfig()` in `src/theme/tailwind.config.ts` so it becomes available as a Tailwind class.
4. Verify the RGB values match the web's `_next-colors.scss` for both `:root` (light) and `.dark` blocks.

### 10.5 Cross-Platform Color Verification

When auditing mobile-to-web consistency, compare:

| Mobile File | Web File | What to Check |
|------------|----------|---------------|
| `src/theme/colors/unified.ts` | `_next-colors.scss` | All 7 families x 12 steps x 2 modes |
| `src/theme/colors/semantic.ts` | `_next-colors.scss` (bottom sections) | Surface, border, alpha tokens |
| `src/theme/colors/brand.ts` | `theme/colors.js` (lines 16-18) | `brand`, `lightBrand`, `inactive` |
