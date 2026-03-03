# Token System Migration Guide

This guide explains how to migrate existing components to use the token system and how to create tokens for new features.

## Overview

The token system provides:
- **Type-safe styling** - Token interfaces prevent invalid color/style references
- **Co-location** - Feature tokens live with their components
- **Consistency** - Shared base types ensure patterns are followed
- **Theme support** - Automatic dark/light mode handling via `useThemedStyles`

## Migrating Existing Components

### Step 1: Identify Inline Styles

Look for components with inline color definitions:

```typescript
// Before: Inline color mappings
const COLORS = {
  primary: { bg: 'bg-iris-3', text: 'text-iris-12' },
  secondary: { bg: 'bg-slate-3', text: 'text-slate-12' },
};
```

### Step 2: Create Feature Styles Folder

Create a `styles/` folder in your feature directory:

```
src/components-next/my-feature/
├── styles/
│   ├── tokens.ts
│   ├── useMyFeatureStyles.ts
│   └── index.ts
├── MyComponent.tsx
└── index.ts
```

### Step 3: Define Tokens

Create `tokens.ts` extending base types:

```typescript
// src/components-next/my-feature/styles/tokens.ts
import {
  type BaseMessageTokens,
  type BaseTextTokens,
} from '@/theme/colors/tokens';

// Define your feature's token types
export interface MyFeatureTokens {
  message: {
    primary: BaseMessageTokens;
    secondary: BaseMessageTokens;
  };
  text: BaseTextTokens;
}

// Define token values using Tailwind classes
export const myFeatureTokens: MyFeatureTokens = {
  message: {
    primary: {
      background: 'bg-iris-3',
      text: 'text-iris-12',
      border: 'border-iris-6',
    },
    secondary: {
      background: 'bg-slate-3',
      text: 'text-slate-12',
      border: 'border-slate-6',
    },
  },
  text: {
    primary: 'text-slate-12',
    secondary: 'text-slate-11',
    muted: 'text-slate-10',
    link: 'text-blue-9',
  },
};
```

### Step 4: Create Styles Hook

Create `useMyFeatureStyles.ts`:

```typescript
// src/components-next/my-feature/styles/useMyFeatureStyles.ts
import { useMemo } from 'react';
import { useThemedStyles } from '@/hooks';
import { myFeatureTokens } from './tokens';

export const useMyFeatureStyles = () => {
  const themedStyles = useThemedStyles();

  return useMemo(
    () => ({
      style: themedStyles.style,
      tokens: myFeatureTokens,
    }),
    [themedStyles.style],
  );
};

export default useMyFeatureStyles;
```

### Step 5: Create Index Exports

Create `index.ts`:

```typescript
// src/components-next/my-feature/styles/index.ts
export * from './tokens';
export { useMyFeatureStyles } from './useMyFeatureStyles';
```

### Step 6: Update Components

Update your components to use the hook:

```typescript
// Before
import { useThemedStyles } from '@/hooks';

const COLORS = {
  primary: { bg: 'bg-iris-3', text: 'text-iris-12' },
};

function MyComponent() {
  const themedTailwind = useThemedStyles();
  return (
    <View style={themedTailwind.style(COLORS.primary.bg)}>
      <Text style={themedTailwind.style(COLORS.primary.text)}>Hello</Text>
    </View>
  );
}

// After
import { useMyFeatureStyles } from './styles';

function MyComponent() {
  const { style, tokens } = useMyFeatureStyles();
  return (
    <View style={style(tokens.message.primary.background)}>
      <Text style={style(tokens.message.primary.text)}>Hello</Text>
    </View>
  );
}
```

## Before/After Examples

### Collapsible Component

**Before:**
```typescript
const ACCENT_COLORS = {
  iris: {
    border: 'border-slate-6',
    borderLeft: 'border-l-iris-9',
    background: 'bg-slate-3/50',
    headerText: 'text-slate-10',
    headerTextActive: 'text-iris-11',
  },
  // ... more colors
};

function AICollapsible({ accentColor }) {
  const themedTailwind = useThemedStyles();
  const colors = ACCENT_COLORS[accentColor];
  
  return (
    <View style={themedTailwind.style(colors.border, colors.background)}>
      <Text style={themedTailwind.style(colors.headerText)}>Title</Text>
    </View>
  );
}
```

**After:**
```typescript
import { useAIStyles } from '../styles';

function AICollapsible({ accentColor }) {
  const { style, getCollapsible } = useAIStyles();
  const colors = getCollapsible(accentColor);
  
  return (
    <View style={style(colors.border, colors.background)}>
      <Text style={style(colors.label)}>Title</Text>
    </View>
  );
}
```

### Message Bubble

**Before:**
```typescript
function MessageBubble({ role }) {
  const themedTailwind = useThemedStyles();
  const isUser = role === 'user';
  
  return (
    <View style={themedTailwind.style(
      isUser ? 'bg-iris-3' : 'bg-slate-3',
      'rounded-xl p-3'
    )}>
      <Text style={themedTailwind.style(
        isUser ? 'text-iris-12' : 'text-slate-12'
      )}>
        {message}
      </Text>
    </View>
  );
}
```

**After:**
```typescript
import { useAIStyles } from '../styles';

function MessageBubble({ role }) {
  const { style, message } = useAIStyles();
  const tokens = message(role);
  
  return (
    <View style={style(tokens.background, 'rounded-xl p-3')}>
      <Text style={style(tokens.text)}>{messageText}</Text>
    </View>
  );
}
```

## Common Patterns

### Role-Based Tokens

```typescript
// tokens.ts
export const messageTokens = {
  user: { background: 'bg-iris-3', text: 'text-iris-12' },
  assistant: { background: 'bg-slate-3', text: 'text-slate-12' },
};

export const getMessageTokens = (role: 'user' | 'assistant') => 
  messageTokens[role];
```

### Accent-Based Tokens

```typescript
// tokens.ts
export type AccentColor = 'iris' | 'slate' | 'teal' | 'ruby';

export const accentTokens: Record<AccentColor, CollapsibleTokens> = {
  iris: { icon: 'text-iris-9', label: 'text-iris-11' },
  slate: { icon: 'text-slate-9', label: 'text-slate-11' },
  // ...
};

export const getAccentTokens = (accent: AccentColor) => 
  accentTokens[accent];
```

### State-Based Tokens

```typescript
// tokens.ts
export type ToolState = 'pending' | 'running' | 'completed' | 'error';

export const stateTokens: Record<ToolState, { icon: string; accent: string }> = {
  pending: { icon: '⏳', accent: 'slate' },
  running: { icon: '⚙️', accent: 'slate' },
  completed: { icon: '✅', accent: 'teal' },
  error: { icon: '❌', accent: 'ruby' },
};
```

## Radix Color Scale Reference

| Step | Usage | Example |
|------|-------|---------|
| 1-2 | App backgrounds | `bg-slate-1` |
| 3 | Component backgrounds | `bg-iris-3` |
| 6 | Borders | `border-slate-6` |
| 9 | Icons, interactive | `text-iris-9` |
| 10 | Secondary labels | `text-slate-10` |
| 11 | Active labels | `text-iris-11` |
| 12 | Primary text | `text-slate-12` |

## Accent Color Semantics

| Color | Usage |
|-------|-------|
| `iris` | Primary/reasoning (AI thinking) |
| `slate` | Default/neutral |
| `teal` | Success states |
| `ruby` | Error states |
| `amber` | Warning states |
| `blue` | Links |

## Checklist

When migrating a component:

- [ ] Create `styles/` folder in feature directory
- [ ] Create `tokens.ts` extending base types
- [ ] Create `use<Feature>Styles.ts` hook
- [ ] Create `index.ts` exports
- [ ] Update component imports
- [ ] Replace inline color definitions with token references
- [ ] Test in both light and dark modes
- [ ] Update any dependent components
