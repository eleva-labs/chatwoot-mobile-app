# Color Mapping Guide - Phase 8

This guide provides mappings from hardcoded hex/rgb colors to Radix theme tokens for systematic color replacement.

## Color Replacement Strategy

### ✅ Replace These Patterns

**Pattern 1: Tailwind Fallbacks**
```typescript
// ❌ BEFORE
color={tailwind.color('text-slate-12') ?? '#202020'}

// ✅ AFTER
const { colors } = useThemeColors();
color={colors.slate[12]}
```

**Pattern 2: Direct Hex Colors**
```typescript
// ❌ BEFORE
<Icon color="#FFFFFF" />

// ✅ AFTER
const { colors } = useThemeColors();
<Icon color={colors.slate[12]} />
```

**Pattern 3: RGB/RGBA Colors**
```typescript
// ❌ BEFORE
backgroundColor: 'rgb(91, 91, 214)'

// ✅ AFTER
const { colors } = useThemeColors();
backgroundColor: colors.iris[9]
```

### ⚠️ Review Before Replacing

**Shadow Colors** (Platform-specific)
```typescript
// May be intentional for iOS shadows
shadowColor: 'rgba(0,0,0,0.25)'

// Decision: Keep if platform-specific, or replace with:
const { colors } = useThemeColors();
shadowColor: colors.slate[11] // with separate shadowOpacity
```

## Common Color Mappings

### Grayscale / Neutral Colors

| Hex Color | RGB Color | Description | Radix Token | Usage |
|-----------|-----------|-------------|-------------|-------|
| `#202020` | `rgb(32,32,32)` | Dark gray text | `colors.slate[12]` | High-contrast text |
| `#60646C` | `rgb(96,100,108)` | Medium gray | `colors.slate[11]` | Low-contrast text |
| `#80838D` | `rgb(128,131,141)` | Light gray | `colors.slate[10]` | Muted text |
| `#BBBBBB` | `rgb(187,187,187)` | Very light gray | `colors.slate[8]` | Borders, icons |
| `#FFFFFF` | `rgb(255,255,255)` | White | `semanticColors.textInverse` | Text on colored backgrounds |
| `#000000` | `rgb(0,0,0)` | Black | `colors.slate[12]` | Maximum contrast text |

### Accent Colors

| Hex Color | RGB Color | Description | Radix Token | Usage |
|-----------|-----------|-------------|-------------|-------|
| `#5B5BD6` | `rgb(91,91,214)` | Iris purple | `colors.iris[9]` | AI features, special actions |
| `#2781F6` | `rgb(39,129,246)` | Blue accent | `colors.blue[9]` | Primary actions, links |
| `#FFC53D` | `rgb(255,197,61)` | Amber yellow | `colors.amber[9]` | Warnings, pending states |
| `#E13D45` | `rgb(225,61,69)` | Ruby red | `colors.ruby[9]` | Errors, danger actions |
| `#12A594` | `rgb(18,165,148)` | Teal green | `colors.teal[9]` | Success states |

### Brand Colors (Chatwoot)

| Hex Color | Description | Radix Token | Usage |
|-----------|-------------|-------------|-------|
| `#1f77d0` | Chatwoot blue | `colors.blue[9]` | Primary brand color |
| `#6E56CF` | Purple accent | `colors.iris[9]` | Secondary brand |

## Semantic Color Usage

Use semantic colors when the meaning is more important than the specific shade:

```typescript
const { semanticColors } = useThemeColors();

// Text colors
semanticColors.text              // Primary text
semanticColors.textSecondary     // Secondary/muted text
semanticColors.textInverse       // Text on colored backgrounds
semanticColors.textDisabled      // Disabled state text

// Background colors
semanticColors.background        // Main background
semanticColors.backgroundSecondary // Secondary background
semanticColors.backgroundActive  // Active/selected background

// State colors
semanticColors.success           // Success states
semanticColors.warning           // Warning states
semanticColors.error             // Error states
semanticColors.info              // Info states
```

## File-Specific Mappings

### AI Chat Components

**AITextPart.tsx** (7 colors)
- `#80838D` → `colors.slate[10]` (muted code text)
- `#202020` fallback → `colors.slate[12]` (primary text)
- `rgb(91, 91, 214)` → `colors.iris[9]` (AI accent)

**AIReasoningPart.tsx** (5 colors)
- `#5B5BD6` → `colors.iris[9]` (reasoning accent)
- Tailwind fallbacks → `colors.slate[11/12]`

**AIToolPart.tsx** (4 colors)
- Similar pattern to AITextPart

### Chat Screen Components

**ChatHeader.tsx** (5 colors)
- `#FFFFFF` → `semanticColors.textInverse` (on colored header)
- Status colors → semantic equivalents

**DeliveryStatus.tsx** (5 colors)
- Tick colors based on status
- `rgb(18,165,148)` → `colors.teal[9]` (delivered)
- `rgb(255,197,61)` → `colors.amber[9]` (pending)

### Infrastructure UI

**ActionTabs.tsx**, **Slider.tsx**, etc.
- Follow same patterns as above
- Prioritize semantic colors for state-based coloring

## Migration Checklist

For each file:

1. ✅ Import `useThemeColors` hook
   ```typescript
   import { useThemeColors } from '@infrastructure/theme';
   ```

2. ✅ Add hook call at component top
   ```typescript
   const { colors, semanticColors } = useThemeColors();
   ```

3. ✅ Replace hardcoded colors with theme tokens
   - Use mapping table above
   - Prioritize semantic colors when applicable

4. ✅ Test in both light and dark mode
   - Verify contrast ratios
   - Check accessibility

5. ✅ Remove unused tailwind color imports if applicable

## Priority Order

1. **AI Components** (10 files) - Highest user visibility
2. **Chat Screen** (12 files) - Core user experience
3. **Infrastructure UI** (14 files) - Reusable components

## Notes

- Shadow colors may be intentionally platform-specific (evaluate case-by-case)
- Test fixtures and developer tools have lower priority
- Keep brand colors in theme definition files (unified.ts, semantic.ts)
- When in doubt, use semantic colors over direct scale values

## Icon Default Colors Reference

Icons use different default colors based on their semantic purpose:

| Default Color | Radix Token | Usage | Examples |
|---------------|-------------|-------|----------|
| **High-Contrast Neutral** | `colors.slate[12]` | Close buttons, navigation icons, interactive UI elements | CloseIcon, ChevronLeft, CaretRight |
| **Low-Contrast Neutral** | `colors.slate[11]` | General utility icons, secondary actions | SearchIcon, FilterIcon, SettingsIcon |
| **Subtle Neutral** | `colors.slate[8]` | Low-emphasis icons, social media badges | Channel icons (Facebook, WhatsApp, Line) |
| **AI/Bot Purple** | `colors.iris[9]` | AI features, bot interactions | AIOnIcon, BotIcon, AIAssist |
| **Primary Action Blue** | `colors.blue[9]` | Primary interactive icons (context-dependent) | ConversationIcon (when active) |

**Note:** These are *default* colors. All icons accept a `color` prop to override the default for specific contexts.
