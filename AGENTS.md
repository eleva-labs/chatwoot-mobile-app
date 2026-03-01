# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
- **Start dev client**: `task start` or `pnpm run start`
- **Start production mode**: `task start-prod`
- **Run on iOS**: `task run-ios` (uses SIMULATOR env from .env)
- **Run on Android**: `task run-android`
- **Start with specific port**: `npx expo start --ios --port 8081`

### Code Quality
- **Run tests**: `task test` or `pnpm run test`
- **Run linting**: `task lint`
- **Fix lint issues**: `task lint-fix`
- **Format code**: `task format`
- **Format + lint fix**: `task format-all` (recommended)
- **Check all**: `task check` (format check + lint)

### Build & Native
- **Prebuild (clean)**: `task generate` or `pnpm run generate`
- **Prebuild (incremental)**: `task generate-soft`
- **Prebuild (fast, skip pods)**: `task generate-fast`
- **Clean all caches**: `task clean-all-caches`
- **Clean iOS cache**: `task clean-ios-cache`
- **Expo doctor**: `task doctor`

### Setup
- **Full setup**: `task setup-full` (install + local-env + dev + verify-patches)
- **Install deps**: `task install` or `pnpm install`
- **Check prerequisites**: `task check-prereqs`
- **Setup local env**: `task setup-local-env`

## Debugging - iOS Simulator Logs

### Log Streaming (Standard Approach)

Use macOS unified logging via `log stream` to capture React Native JavaScript logs from the iOS simulator. This is the **recommended, zero-setup** approach.

**Stream logs to terminal:**
```bash
xcrun simctl spawn booted log stream \
  --predicate 'subsystem == "com.facebook.react.log" AND category == "javascript"' \
  --style compact \
  --level info
```

**Capture logs to file (background):**
```bash
xcrun simctl spawn booted log stream \
  --predicate 'subsystem == "com.facebook.react.log" AND category == "javascript"' \
  --style compact \
  --level info > /tmp/rn-logs.txt 2>&1 &
```

**Monitor captured logs:**
```bash
tail -f /tmp/rn-logs.txt
```

**Filter for errors/warnings:**
```bash
tail -f /tmp/rn-logs.txt | grep -i "error\|warn"
```

**Stop background log capture:**
```bash
kill %1  # or find PID with: ps aux | grep "log stream"
```

### Why This Approach
- Zero setup required - uses built-in macOS `log stream`
- Works immediately with any booted iOS simulator
- No additional packages, no Flipper, no React Native Debugger needed
- Captures all `console.log`, `console.warn`, `console.error` from JS
- Can run in background without interfering with Metro bundler

## Path Aliases

The codebase uses TypeScript path aliases for Clean Architecture layer separation:

| Alias | Maps To | Layer | Purpose |
|-------|---------|-------|---------|
| `@domain/*` | `src/domain/*` | Domain | Pure business logic (entities, types, constants) |
| `@infrastructure/*` | `src/infrastructure/*` | Infrastructure | Framework dependencies (UI, utils, theme, i18n) |
| `@application/*` | `src/application/*` | Application | App orchestration (Redux store, navigation) |
| `@screens/*` | `src/screens/*` | Presentation | Feature screens |
| `@presentation/*` | `src/presentation/*` | Presentation | AI chat extraction boundary |

### Usage Examples

```typescript
// ✅ Good: Use path aliases
import { User } from '@domain/types/User';
import { Avatar } from '@infrastructure/ui/common/avatar';
import { useAuth } from '@application/store/auth/authSelectors';

// ❌ Bad: Relative imports beyond parent directory
import { User } from '../../../domain/types/User';
```

### Layer Import Rules

- **Domain**: Cannot import from any other layer (pure TypeScript)
- **Infrastructure**: Can import from `@domain/` and `@application/`
- **Application**: Can import from `@domain/` and `@infrastructure/`
- **Screens**: Can import from all layers except `@presentation/`
- **Presentation** (AI chat): Can import from all layers

See `docs/architecture/clean-architecture.md` for full architecture details.

## Architecture Overview

This is a React Native + Expo SDK 52 mobile application using TypeScript and Clean Architecture principles.

### Tech Stack
- **Runtime**: React Native with Expo SDK 52
- **Language**: TypeScript
- **Package Manager**: pnpm 9.x (via Volta)
- **Node**: 20.x (via Volta)
- **State Management**: Redux (store/) + React Context
- **DI**: tsyringe for dependency injection
- **Styling**: twrnc (Tailwind React Native Classnames)
- **Navigation**: React Navigation
- **AI SDK**: Vercel AI SDK v5 (`ai@5.0.93`, `@ai-sdk/react@^2.0.93`)

### Clean Architecture Layers (`src/`)

| Layer | Folder | Purpose | Dependencies |
|-------|--------|---------|--------------|
| **Domain** | `domain/` | Pure business logic (entities, types, constants) | None (extraction-ready) |
| **Infrastructure** | `infrastructure/` | Framework adapters (UI, utils, theme, i18n) | `@domain/`, `@application/` |
| **Application** | `application/` | App orchestration (Redux store, navigation) | `@domain/`, `@infrastructure/` |
| **Presentation** | `screens/`, `presentation/ai-chat/` | Feature screens + AI chat | All layers |

### Directory Structure

```
src/
├── app.tsx              # Root component, mounts providers
│
├── domain/              # Pure business logic (NO React, NO external deps)
│   ├── entities/        # Business entities
│   ├── types/           # Business type definitions
│   ├── constants/       # Business constants
│   └── interfaces/      # Port interfaces
│
├── infrastructure/      # Framework dependencies (React OK)
│   ├── ui/              # Reusable UI components (Avatar, Button, Icon)
│   ├── hooks/           # React hooks (useThemedStyles, useScreenAnalytics)
│   ├── utils/           # Utilities (dateTimeUtils, fileUtils)
│   ├── theme/           # Radix-based design system
│   ├── i18n/            # Internationalization
│   ├── context/         # React Context providers
│   └── ...
│
├── application/         # Application orchestration
│   ├── store/           # Redux state management
│   └── navigation/      # React Navigation configuration
│
├── screens/             # Feature screens (conversations, inbox, settings)
│
└── presentation/        # AI chat ONLY (extraction boundary)
    └── ai-chat/         # AI assistant feature
```

For full architecture details and decision trees, see:
- `docs/architecture/clean-architecture.md` - Canonical reference

### AI Assistant Architecture (`src/presentation/`)

The AI assistant feature follows a layered structure:

- **`hooks/ai-assistant/`**: Core logic hooks
  - `useAIChat.ts` - Wraps Vercel AI SDK `useChat`, exposes `status` field
  - `useAIChatMessages.ts` - Merges persisted + streaming messages (fingerprint memoization)
  - `useAIChatScroll.ts` - Auto-scroll, scroll-to-top/bottom, debounced state
  - `useAIChatBot.ts` - Bot selection, avatar data
  - `useAIChatSessions.ts` - Session management

- **`containers/ai-assistant/`**: Container components
  - `AIChatInterface.tsx` - Main chat interface, orchestrates hooks
  - `FloatingAIAssistant.tsx` - Floating panel wrapper (theme-aware)
  - `types.ts` - Shared prop types

- **`components/ai-assistant/`**: UI components
  - `AIChatMessagesList.tsx` - FlashList-based message list
  - `AIMessageBubble.tsx` - Individual message bubble with avatar layout
  - `AIChatHeader.tsx` - Header with status indicator
  - `AIChatError.tsx` - Rich error UI with categorization
  - `AIChatEmptyState.tsx` - Styled empty state

- **`parts/ai-assistant/`**: Message part renderers
  - `AITextPart.tsx` - Markdown text with streaming cursor
  - `AIToolPart.tsx` - Tool invocation display (input + output)
  - `AIReasoningPart.tsx` - Collapsible reasoning with markdown
  - `AICollapsible.tsx` - Animated collapsible wrapper

### Theme System

**Two theme providers coexist:**

1. **Legacy ThemeContext** (`src/context/ThemeContext.tsx`): Simple `isDark` boolean, used by ~170+ files. Dark mode via regex string replacement in `useThemedStyles`.
2. **Radix ThemeProvider** (`src/theme/components/ThemeProvider.tsx`): Full 12-step Radix color scales + semantic tokens. Used by AI components via `useThemeColors()`.

Both are mounted in `app.tsx` (Radix nested inside Legacy).

**Usage in AI components:**
```typescript
// Correct - destructure colors from return value
const { colors, semanticColors } = useThemeColors();

// Wrong - useThemeColors() returns { colors, semanticColors }, not colors directly
const colors = useThemeColors(); // TypeScript error
```

### Icon System
- Custom SVG icons from `@/svg-icons` (not Lucide)
- `Avatar` component at `@/components-next/common/avatar/Avatar`
- `Icon` component at `@/components-next/common/icon/Icon`

## Development Guidelines

- Follow existing codebase patterns and conventions
- Use Clean Architecture: dependencies point inward (infrastructure -> application -> domain)
- Use tsyringe for dependency injection
- Use `twrnc` (tw) for styling - import from the project's tailwind singleton
- Always use TypeScript with proper type annotations
- Prefer editing existing files over creating new ones
- Test changes on iOS simulator before committing

## Environment

### Local Development Network
- **Metro bundler**: port 8081 (`npx expo start --ios --port 8081`)
- **Chatwoot Rails**: port 3000 (Docker)
- **Chatwoot Vite**: port 3036 (Docker)
- **AI Backend**: port 8000 (local Python FastAPI)
- **iOS simulator shares host network** - `localhost` reaches the Mac's localhost
- **Chatwoot .env**: `AI_BACKEND_URL=http://host.docker.internal:8000`

### Branch Strategy
- **Base branch**: `development`
- **Feature branches**: `feature/<description>`
- **Release/hotfix branches**: Never delete, even if merged

## Git Workflow

- Run all git commands from within this directory (not the parent workspace root)
- Use `workdir` parameter in Bash tool: `Bash(command="git status", workdir="chatwoot-mobile-app/")`
- Don't reference Claude in commit messages
