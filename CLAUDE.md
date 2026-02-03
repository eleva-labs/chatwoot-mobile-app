# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chatwoot Mobile is a React Native/Expo app for customer support agents to manage conversations on the go. Built on the Chatwoot open-source platform.

**Tech Stack:** React Native 0.76.9, Expo SDK 52, TypeScript 5.1.3, Node.js ≥22.12.0, pnpm

## Essential Commands

```bash
# Development
pnpm start                    # Start Metro bundler (long-running)
pnpm run ios:run              # Run on iOS via Expo (long-running)
pnpm run ios:sim              # Build & run iOS simulator without code signing (long-running)
pnpm run android:run          # Run on Android (long-running)

# Quality
pnpm test                     # Run Jest tests
pnpm run lint                 # ESLint check
pnpm run lint:fix             # ESLint auto-fix

# iOS-specific
pnpm run ios:pods             # Install CocoaPods
pnpm run ios:clean            # Clean iOS build artifacts
pnpm run generate             # Expo prebuild (regenerate native code)

# Environment
pnpm run env:pull:dev         # Pull dev environment from EAS (replaces local)
pnpm run env:merge:dev        # Pull and merge (preserves local values)

# Diagnostics
pnpm run doctor               # Run Expo diagnostics
```

## Architecture

### Source Structure (`src/`)

```
src/
├── store/              # Redux Toolkit slices (auth, conversation, contact, etc.)
├── screens/            # Screen components organized by feature
├── components-next/    # Reusable UI components (next-gen design system)
├── navigation/         # React Navigation stacks (Auth, Inbox, Conversation, Settings)
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── services/           # API services and external integrations
├── types/              # TypeScript interfaces and types
├── utils/              # Utility functions
├── theme/              # Tailwind config, colors (light/dark), fonts
├── i18n/               # Internationalization (40+ locales)
├── domain/             # Domain layer (clean architecture)
├── infrastructure/     # Infrastructure layer
└── app.tsx             # Main app component
```

### Redux Store Structure

State is organized by feature with nested slices:
- `auth` - Authentication state
- `settings` - App settings (persisted)
- `conversations` - Filter, selected, list, typing, messages, audio
- `contacts` - List, labels, conversations
- `notifications` - List, filter
- `inboxes`, `labels`, `teams`, `macros`, `cannedResponses`

### Navigation

Four main stacks: `AuthStack`, `InboxStack`, `ConversationStack`, `SettingsStack`

Entry point: `App.tsx` → `src/app.tsx` → Navigation based on auth state

## Code Conventions

### TypeScript
- Prefer interfaces over types
- Avoid enums; use maps instead
- Use functional components with TypeScript interfaces

### Styling
- Use `tailwind` utility from `@/theme/tailwind` for all styling
- Colors defined in `src/theme/colors/` (light.ts, dark.ts)
- Inter font family with custom weights (400-600)

```typescript
import { tailwind } from '@/theme/tailwind';
<View style={tailwind('bg-blue-500 p-4')}>
  <Text style={tailwind('text-md font-inter-normal-20')}>Hello</Text>
</View>
```

### State Management
- Redux Toolkit with `createSlice` for reducers
- Redux Persist for state persistence
- Use typed hooks: `useAppDispatch`, `useAppSelector`

### File Structure
- Lowercase with dashes for directories: `components/auth-wizard`
- Named exports for components
- Index files for barrel exports

## Build Configuration

- **Firebase credentials**: `credentials/ios/` and `credentials/android/`
- **EAS Build**: Configured in `eas.json` (development, production, simulator profiles)
- **Environment**: `.env` file with `EXPO_PUBLIC_*` variables

## Testing

```bash
pnpm test                     # Run all tests
pnpm test -- --watch          # Watch mode
pnpm test -- path/to/test     # Run specific test
```

Tests located in `src/__tests__/` and `__mocks__/`
