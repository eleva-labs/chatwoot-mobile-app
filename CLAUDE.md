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

### Directory Structure (`src/`)

| Directory | Purpose |
|-----------|---------|
| `app.tsx` | Root component, mounts providers |
| `domain/` | Entities, enums, interfaces - no external dependencies |
| `application/` | Use cases, business logic |
| `infrastructure/` | External integrations, API clients, repositories |
| `dependency-injection/` | tsyringe DI container configuration |
| `presentation/` | UI layer: components, containers, hooks, parts, styles |
| `components-next/` | Next-gen shared components (Avatar, Icon, etc.) |
| `screens/` | Screen-level components |
| `navigation/` | React Navigation configuration |
| `store/` | Redux store, slices, selectors |
| `context/` | React Context providers (ThemeContext, etc.) |
| `theme/` | Radix-based theme system with color scales |
| `svg-icons/` | Custom SVG icon components |
| `i18n/` | Internationalization |
| `services/` | Service layer |
| `hooks/` | Global React hooks |
| `utils/` | Utility functions |
| `constants/` | App constants |
| `types/` | Global TypeScript types |
| `modules/` | Feature modules |

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
