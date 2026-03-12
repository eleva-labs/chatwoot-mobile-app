# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Common Development Commands

### Development Server
- **Start dev client**: `task start` or `pnpm run start`
- **Start production mode**: `task start-prod`
- **Run on iOS**: `task run-ios` (uses SIMULATOR env from .env)
- **Run on Android**: `task run-android`
- **Start with specific port**: `npx expo start --ios --port 8081`
- **Important for CLI agents**: Prefer launching long-running native commands asynchronously/in the background when possible (Expo start, `pnpm run ios`, `pnpm run android`, emulator boot) so the CLI does not block or time out on native build output.

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

## Testing

### Running Tests

- **Run all tests**: `task test` or `pnpm test`
- **Run with coverage**: `pnpm test -- --coverage`
- **Run single test**: `npx jest path/to/test.ts`
- **Run in watch mode**: `pnpm test -- --watch`
- **Update snapshots**: `pnpm test -- -u`

### Test Infrastructure

- **Global setup**: `src/__tests__/setup.ts` - Mocks for 15+ modules
- **Test utilities**: `src/__tests__/helpers/`
  - `renderWithProviders(ui, { preloadedState })` - Redux-connected components
  - `createTestStore(preloadedState)` - Redux store testing
  - Type builders: `aConversation()`, `aContact()`, `anAgent()`, etc.
  - Custom matchers: `toBeSuccess()`, `toBeFailure()`, `toHaveValue()`, `toHaveError()`

### Writing Tests

- **Domain tests**: Pure TypeScript, no React dependencies
- **Redux tests**: Use `createTestStore` + type builders
- **Component tests**: Use `renderWithProviders` + `screen` queries
- **Hook tests**: Use `renderHook` from `@testing-library/react-native`

See `docs/architecture/unit-testing.md` for complete testing guide.

### CI/CD

- Tests run automatically on PRs to `development` and `main`
- Coverage thresholds: branches 13%, functions 15%, lines 15%, statements 15% (temporary baseline post-refactor)
- GitHub Actions workflow: `.github/workflows/test.yml`

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

For full architecture details and decision trees, see `docs/architecture/` directory.

## Architecture Documentation

Complete architecture guides available in `docs/architecture/`:

| Document | Description |
|----------|-------------|
| [clean-architecture.md](docs/architecture/clean-architecture.md) | Clean Architecture layers, dependency rules, icon system |
| [ai-chat-architecture.md](docs/architecture/ai-chat-architecture.md) | AI assistant feature architecture |
| [styling-architecture.md](docs/architecture/styling-architecture.md) | Theme system, Radix colors, styling patterns |
| [unit-testing.md](docs/architecture/unit-testing.md) | Testing strategy, utilities, builders, patterns |

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

**Dual Theme Architecture:**

1. **Legacy ThemeContext** (`src/infrastructure/context/ThemeContext.tsx`)
   - Simple `isDark` boolean
   - Used by ~170+ files
   - Dark mode via regex string replacement in `useThemedStyles()`

2. **Radix ThemeProvider** (`src/infrastructure/theme/components/ThemeProvider.tsx`)
   - Full 12-step Radix color scales + semantic tokens
   - Used by AI components and new code
   - Access via `useThemeColors()` hook

Both are mounted in `app.tsx` (Radix nested inside Legacy).

**Usage:**
```typescript
const { colors, semanticColors } = useThemeColors();

// Scale-based colors
color={colors.slate[12]}  // High-contrast text

// Semantic colors
color={semanticColors.text}  // Primary text (theme-aware)
```

See `docs/architecture/styling-architecture.md` for complete theme guide.

### Icon System

The project uses a **standardized icon system** with unified theme-aware defaults:

- **Custom SVG icons** from `@/svg-icons` (NOT Lucide React Native)
- All icons proxy to Lucide with consistent defaults
- Theme-aware colors: `colors.slate[12]`, `colors.slate[11]`, `colors.iris[9]`
- Consistent prop interfaces: `size` and `color`

**Usage:**
```typescript
import { CloseIcon } from '@/svg-icons/common/CloseIcon';

<CloseIcon size={24} color={colors.slate[12]} />
```

See `docs/architecture/clean-architecture.md` for icon migration details.

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
