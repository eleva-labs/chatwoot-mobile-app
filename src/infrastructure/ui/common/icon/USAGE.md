# Icon System Usage Guide

The enhanced Icon component system provides two ways to use icons in the Chatwoot mobile app.

## API Overview

### 1. String-based API (Recommended)

Better developer experience with TypeScript autocomplete and type safety.

#### Using Icon with `name` prop

```tsx
import { Icon } from '@infrastructure/ui/common/icon';

// Basic usage
<Icon name="bot" />

// With size
<Icon name="attach-file" size={32} />

// With custom color
<Icon name="warning" color="#FF0000" />

// With variant (for icons that support it)
<Icon name="conversation" variant="filled" />
<Icon name="inbox" variant="outline" />
<Icon name="settings" variant="default" />
```

#### Using NamedIcon directly

```tsx
import { NamedIcon } from '@infrastructure/ui/common/icon';

<NamedIcon name="bot" size={24} />
<NamedIcon name="send" color="#0066FF" />
```

### 2. JSX-based API (Legacy)

Backward compatible with existing code.

```tsx
import { Icon } from '@infrastructure/ui/common/icon';
import { BotIcon } from '@/svg-icons';

<Icon icon={<BotIcon />} size={24} />
```

## Available Icons

Total icons: **117**

Icons with variants:
- **Filled variants**: 6 icons (conversation, inbox, pending, resolved, settings, snoozed)
- **Outline variants**: 3 icons (conversation, inbox, settings)

### Icon Names (kebab-case)

All icon names use kebab-case for consistency:

- `add`, `add-participant`
- `ai-assisst`, `ai-on`
- `assign`, `attach-file`, `attachment`, `audio`
- `bot`
- `call`, `camera`, `canned-response`, `caret-bottom-small`, `caret-right`
- `chat`, `chatwoot`, `check`, `checked`, `chevron-left`, `clear`, `close`, `company`
- `conversation` (has filled, outline variants)
- `copy`
- `delete`, `document-attachment`, `double-check`
- `email`, `empty-state`, `error`, `eye`, `eye-slash`
- `facebook`, `facebook-channel`, `facebook-filled`
- `file`, `file-error`, `filter`
- `github`, `grid`
- `high`
- `image-attachment`
- `inbox` (has filled, outline variants)
- `inbox-filter`, `info`, `instagram-filled`
- `key-round`
- `label-tag`, `link`, `linked`, `linkedin`, `loading`, `location`, `lock`, `low`
- `macro`, `macros`, `mail`, `mail-filled`, `map`
- `mark-as-read`, `mark-as-unread`, `medium`, `message-pending`, `messenger-filled`, `mute`
- `no-priority`, `notification`, `notification-assigned`, `notification-mention`, `notification-new-message`, `notification-sla`, `notification-snoozed`
- `open`, `outgoing`, `overflow`
- `pending` (has filled variant)
- `person`, `phone`, `photos`, `play`, `player`, `priority`, `private-note`
- `resolved` (has filled variant)
- `search`, `self-assign`, `send`
- `settings` (has filled, outline variants)
- `sla`, `sla-missed`, `sms-filled`
- `snoozed` (has filled variant)
- `status`, `switch`
- `team`, `telegram`, `telegram-filled`, `theme`, `tick`, `translate`, `trash`
- `unassigned`, `unchecked`, `urgent`, `user`
- `video-call`, `voice-note`
- `warning`, `website`, `website-filled`, `whatsapp`, `whatsapp-filled`
- `x`, `x-filled`

## TypeScript Support

The system provides full TypeScript support:

```tsx
import type { IconName, IconVariant } from '@infrastructure/ui/common/icon';

// IconName type provides autocomplete for all 117 icon names
const myIcon: IconName = 'bot';

// IconVariant type for variant prop
const variant: IconVariant = 'filled';
```

## Migration Guide

### Migrating from JSX-based to string-based

Before:
```tsx
import { Icon } from '@infrastructure/ui/common/icon';
import { BotIcon } from '@/svg-icons';

<Icon icon={<BotIcon />} size={24} />
```

After:
```tsx
import { Icon } from '@infrastructure/ui/common/icon';

<Icon name="bot" size={24} />
```

Benefits:
- No need to import individual icon components
- Autocomplete for icon names
- Type safety with TypeScript
- Smaller bundle size (tree-shaking friendly)

## Implementation Details

### Files

- `iconRegistry.ts` - Icon name registry and TypeScript types
- `NamedIcon.tsx` - String-based icon component
- `Icon.tsx` - Unified icon component (supports both APIs)
- `index.ts` - Public exports

### Architecture

```
Icon (with name prop)
  ↓
NamedIcon
  ↓
iconRegistry
  ↓
SVG Icon Component
```

The Icon component checks for the `name` prop and delegates to NamedIcon if present, otherwise falls back to the legacy JSX-based behavior for backward compatibility.
