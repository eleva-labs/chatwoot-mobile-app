# Chatwoot Mobile Development Guidelines

## Architecture Overview

**Stack**: React Native 0.76.9 + Expo SDK 52 + TypeScript 5.1.3 + Redux Toolkit + Firebase
**Style**: Feature-based modular architecture with service-oriented patterns
**Real-time**: ActionCable (WebSockets from Chatwoot Rails backend)
**State**: Redux Toolkit with Redux Persist (AsyncStorage)
**Styling**: Tailwind CSS via twrnc (no custom CSS/styles)

### Key Patterns

- **Slices** (`src/store/[feature]/[feature]Slice.ts`) - Redux Toolkit state management
- **Services** (`src/store/[feature]/[feature]Service.ts`) - API calls via Axios singleton
- **Actions** (`src/store/[feature]/[feature]Actions.ts`) - createAsyncThunk with typed errors
- **Selectors** (`src/store/[feature]/[feature]Selectors.ts`) - Memoized state accessors
- **Listeners** (`src/store/[feature]/[feature]Listener.ts`) - Event-driven reactions using createListenerMiddleware
- **Hooks** (`src/hooks/`) - Custom React hooks (e.g., `usePushNotifications`, `useThemedStyles`)
- **Utils** (`src/utils/`) - Pure functions (data transformation, validation, helpers)
- **ActionCable Connector** - WebSocket pub/sub for real-time events (`src/utils/actionCable.ts`)

### Directory Structure

```
src/
├── store/                  # Redux state (25 slices)
│   ├── auth/              # Auth slice + service + actions + selectors + specs
│   ├── conversation/      # Conversation state (6 sub-slices)
│   ├── contact/           # Contact state (3 sub-slices)
│   ├── notification/      # Notifications (list + filter)
│   └── [feature]/
│       ├── [feature]Slice.ts      # createSlice with reducers
│       ├── [feature]Service.ts    # API calls
│       ├── [feature]Actions.ts    # createAsyncThunk
│       ├── [feature]Selectors.ts  # State selectors
│       ├── [feature]Types.ts      # TypeScript types
│       └── specs/                 # Jest tests
├── services/              # Business logic layer
│   └── APIService.ts      # Singleton Axios with interceptors
├── utils/                 # Pure utility functions
│   ├── actionCable.ts     # WebSocket connector
│   ├── camelCaseKeys.ts   # snake_case → camelCase transformer
│   ├── toastUtils.ts      # Toast notifications
│   ├── firebaseUtils.ts   # Firebase init & tokens
│   └── specs/             # Utility tests
├── hooks/                 # Custom React hooks
├── components-next/       # New UI components (preferred)
├── screens/               # Screen components
│   ├── auth/             # Login, forgot password, change URL
│   ├── chat-screen/      # Message view & actions
│   ├── conversations/    # Conversation list
│   ├── contact-details/  # Contact info
│   ├── inbox/            # Inbox management
│   ├── settings/         # App settings
│   └── dashboard/        # Main dashboard
├── navigation/            # React Navigation config
│   ├── stack/            # Stack navigators
│   └── tabs/             # Bottom tab navigation
├── theme/                 # Tailwind config
│   ├── tailwind.config.ts # Base config
│   ├── colors/           # Light/dark theme colors
│   └── tailwind.ts       # Exported instance
├── types/                 # TypeScript interfaces
├── context/               # React Context providers
├── i18n/                  # Translations (i18n-js)
└── svg-icons/             # SVG components

android/                   # Native Android code
ios/                       # Native iOS code
credentials/               # Firebase configs (gitignored)
  ├── android/
  │   ├── google-services.json
  │   └── google-services-dev.json
  └── ios/
      ├── GoogleService-Info.plist
      └── GoogleService-Info-dev.plist
```

See `.cursor/rules/about.mdc` for detailed conventions.

## Commands

### Development Setup

**First Time Setup**
```bash
# 1. Install dependencies
pnpm install

# 2. Pull environment variables from Expo dashboard
./scripts/pull-env.sh development  # or production

# 3. Setup Firebase credentials
# Place google-services.json and GoogleService-Info.plist in credentials/

# 4. Generate native code
pnpm run generate  # Clean prebuild

# 5. Run the app
pnpm run android:dev  # Android
pnpm run ios:dev      # iOS (macOS only)
```

**After Code Changes**
```bash
# JavaScript/TypeScript changes - hot reload automatic
# Just save the file

# For native code changes (plugins, permissions)
pnpm run generate  # Rebuild native code
```

**After Environment Variable Changes**
```bash
# Pull latest from Expo dashboard
./scripts/pull-env.sh development

# Restart dev server
pnpm start
```

**Clean Cache (When Metro Gets Stuck)**
```bash
pnpm run clean            # Clean watchman + yarn cache
pnpm start --clear        # Start with cleared Metro cache
```

### Testing

**IMPORTANT: Run tests with pnpm test - Jest is configured for React Native preset**

**Unit Tests (Jest)**
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- src/store/auth/specs/authSlice.spec.ts

# Run tests for a module
pnpm test -- src/store/conversation

# Coverage report
pnpm test -- --coverage
```

**Test File Patterns**:
- Tests live in `/specs` subdirectories (not co-located)
- Naming: `*.spec.ts` or `*.spec.tsx`
- Mock external dependencies in `__mocks__/`

**Example Test Structure**:
```typescript
// src/store/auth/specs/authSlice.spec.ts
jest.mock('@/services/APIService', () => ({
  apiService: { get: jest.fn(), post: jest.fn() }
}));

describe('authSlice', () => {
  it('should handle initial state', () => { ... });
  it('should handle logout', () => { ... });
});
```

### Building

**Local Development Builds**
```bash
# Requires Android Studio (Android) or Xcode (iOS)
pnpm run build:android:local  # Builds locally
pnpm run build:ios:local      # macOS only
```

**Cloud Builds (EAS Build)**
```bash
# Production builds (uploads to Expo)
pnpm run build:android:prod   # Android app bundle
pnpm run build:ios:prod       # iOS archive

# Check build status
eas build:list
```

### Debugging

```bash
# Start Expo dev server with tools
pnpm start

# Android logs
adb logcat | grep "ReactNative\|com.chatwoot.app"

# iOS logs
npx react-native log-ios

# Connect ADB reverse proxy
pnpm run adb:connect  # For Android local development

# Run Expo doctor
pnpm run run:doctor
```

### Storybook (Component Development)

```bash
pnpm run storybook-generate   # Generate stories
pnpm run start:storybook      # Start Storybook server
pnpm run storybook:android    # Run on Android
pnpm run storybook:ios        # Run on iOS
```

### Quick Reference

- **Lint**: `pnpm run lint` (ESLint + Prettier)
- **Type Check**: `tsc --noEmit`
- **Clean**: `pnpm run clean` (watchman + cache)
- **Prebuild**: `pnpm run generate` (native code generation)

## Critical Code Style Rules

### Styling

- **Tailwind Only**: Do not write custom CSS, scoped styles, or StyleSheet.create - use Tailwind utility classes via `tailwind()` from `@/theme/tailwind`
- **Theme Import**: `import { tailwind } from '@/theme/tailwind'`
- **Colors**: Refer to `src/theme/tailwind.config.ts` and `src/theme/colors/` for color definitions
- **Fonts**: Use predefined Inter fonts (`font-inter-normal-20`, `font-inter-medium-24`, etc.)
- **Custom Sizes**: `text-xs` (12px), `text-cxs` (13px), `text-md` (15px)
- **Dark Mode**: Theme switches automatically - use semantic color names

### TypeScript

- **Strict Mode**: Always enabled
- **Interfaces over Types**: Prefer `interface` for object shapes
- **No Enums**: Use maps or union types instead
- **Path Aliases**: Use `@/` for `src/` imports
- **Typed Redux**: Use `RootState`, `AppDispatch`, `AppThunk` from `@/store`
- **Function Components**: Always use functional components with TypeScript interfaces

### React Native / Expo

- **Composition API**: Use functional components with hooks (no class components)
- **Component Naming**: PascalCase for components, camelCase for props/events
- **Hooks**: Use `useState`, `useEffect`, `useMemo`, `useCallback` appropriately
- **Store Access**: `useAppDispatch()` and `useAppSelector()` from `@/store/hooks`
- **Safe Areas**: Use `SafeAreaView` from `react-native-safe-area-context`
- **Cleanup**: Always cleanup timers, intervals, subscriptions in `useEffect` return
- **Flash Lists**: Use `@shopify/flash-list` for long lists (not FlatList)

### Redux / State Management

- **Slice Pattern**: Use `createSlice` from Redux Toolkit
- **Async Actions**: Use `createAsyncThunk` with typed errors (see `authActions.ts` for factory pattern)
- **Services**: Keep API calls in `[feature]Service.ts` (static methods)
- **Selectors**: Create memoized selectors in `[feature]Selectors.ts`
- **Listeners**: Use `createListenerMiddleware` for cross-slice reactions
- **Immer**: Use direct mutations in reducers (Redux Toolkit uses Immer internally)
- **No Direct Store Import**: Use hooks (`useAppSelector`, `useAppDispatch`)

### API & Data

- **API Service**: Use `apiService` singleton from `@/services/APIService`
- **Data Transformation**: All API responses must be camelCased via `camelCaseKeys()`
- **Error Handling**: API errors auto-handled by interceptor (shows toast, 401 → logout)
- **URL Construction**: Account ID automatically injected by interceptor
- **Auth Headers**: Automatically added from Redux state

### File Organization

- **Lowercase Directories**: Use `kebab-case` (e.g., `chat-screen/`)
- **Feature Structure**: Each store feature has `slice.ts`, `service.ts`, `actions.ts`, `selectors.ts`, `types.ts`, `specs/`
- **Test Location**: Tests in `/specs` subdirectories (not co-located)
- **Component Structure**: Export component → subcomponents → helpers → types
- **Named Exports**: Prefer named exports over default exports

## General Guidelines

- MVP focus: Minimal code change, happy-path first
- Break down complex tasks into small, testable units
- Remove dead/unreachable/unused code
- Don't write multiple versions - pick best approach and implement
- Use existing patterns (look at `auth/`, `conversation/`, `contact/` for examples)
- Test both iOS and Android when changing UI
- No bare strings - use `i18n` for user-facing text
- Security: Sanitize inputs, use HTTPS, never commit credentials

## Project-Specific Conventions

### Environment Management

- **Two Environments**: `development` (dev) and `production` (prod)
- **Bundle IDs**:
  - Dev: `com.chatscommerce.app.dev`
  - Prod: `com.chatscommerce.app`
- **Environment Detection**: `app.config.ts` reads `ENVIRONMENT` or `EAS_BUILD_PROFILE`
- **Firebase Configs**: Separate files in `credentials/` directory
- **URL Override**: Redux store detects environment mismatch on launch and overrides persisted URLs

### Translations (i18n)

- **Backend API**: Returns snake_case → transform to camelCase in app
- **Frontend i18n**: Use `i18n-js` package with JSON files in `src/i18n/`
- **No Bare Strings**: All user-facing text must use `I18n.t('KEY')`
- **Supported Languages**: Multiple languages in `src/i18n/` (primary: English)

### Domain Concepts

- **Real-time Updates**: ActionCable WebSocket connection from Chatwoot Rails backend
- **Presence System**: User availability broadcast every 20 seconds via WebSocket
- **Typing Indicators**: 30-second auto-timeout for typing status
- **Push Notifications**: Firebase Cloud Messaging + Notifee for local display
- **Account Isolation**: Multi-tenant with account-based filtering (no schema separation)
- **Roles**: `administrator` vs `agent` with permission arrays

### Git Workflow

- **Base Branch**: `development` (NOT `develop`)
- **Production Branch**: `main` (NOT `master`)
- **Feature Branches**: Create from `development`
- **CI/CD**: Merge to `main` triggers automatic EAS builds + app store submissions

### Naming Conventions

- **Components**: PascalCase (e.g., `ChatScreen`, `MessageBubble`)
- **Files**: PascalCase for components, camelCase for utilities
- **Directories**: kebab-case (e.g., `chat-screen/`, `contact-details/`)
- **Redux Slices**: camelCase with Slice suffix (e.g., `authSlice`, `conversationSlice`)
- **Test Files**: `*.spec.ts` or `*.spec.tsx`

### Redux Store Structure

**Complete State Tree**:
```typescript
RootState {
  auth: AuthState                           // User, headers, account
  settings: SettingsState                   // Base URL, installation URL, locale
  conversations: {
    filter: ConversationFilterState         // Status, inbox, assignee filters
    selected: ConversationSelectedState     // Currently selected conversation
    header: ConversationHeaderState         // Header UI state
    list: ConversationState                 // Conversation records
    actions: ConversationActionState        // Assign, resolve, mute actions
    typing: ConversationTypingState         // Typing indicators
    sendMessage: SendMessageState           // Message sending state
    audioPlayer: AudioPlayerState           // Audio playback
    localRecordedAudioCache: State          // Local audio cache
    participants: ParticipantState          // Conversation participants
  }
  contacts: {
    list: ContactState                      // Contact records
    labels: ContactLabelState               // Contact labels
    conversations: ContactConversationState // Contact conversations
  }
  labels: LabelState                        // Conversation labels
  inboxes: InboxState                       // Channels
  assignableAgents: AssignableAgentState    // Team members
  notifications: {
    list: NotificationState                 // Notification records
    filter: NotificationFilterState         // Notification filters
  }
  teams: TeamState                          // Teams
  macros: MacroState                        // Saved macros
  dashboardApps: DashboardAppState          // Integrated apps
  customAttributes: CustomAttributeState    // Custom fields
  cannedResponses: CannedResponseState      // Quick replies
}
```

**Important State Behaviors**:
- **Global Logout**: `auth/logout` action resets all state except `settings`
- **Persistence**: All state persisted to AsyncStorage except middleware state
- **Migration**: Version 2 (increments on breaking changes)
- **Environment Sync**: On rehydration, checks persisted URLs vs env vars and overrides if mismatched

### ActionCable Events

WebSocket events handled by `src/utils/actionCable.ts`:

- `message.created` → Add/update message in conversation
- `message.updated` → Update message content/status
- `conversation.created` → Add new conversation
- `conversation.status_changed` → Update status (open/resolved/pending)
- `conversation.read` → Mark conversation as read
- `assignee.changed` → Update assignee
- `conversation.updated` → Update conversation metadata
- `conversation.typing_on` → Show typing indicator (30s timeout)
- `conversation.typing_off` → Hide typing indicator
- `contact.updated` → Update contact details
- `notification.created` → Add notification
- `notification.deleted` → Remove notification
- `presence.update` → Update user availability

All incoming data is transformed from snake_case to camelCase before dispatch.

## Firebase & Push Notifications

### Setup Requirements

1. **Credentials Location**: `/credentials/{android,ios}/`
2. **Android**: `google-services.json` (prod) and `google-services-dev.json` (dev)
3. **iOS**: `GoogleService-Info.plist` (prod) and `GoogleService-Info-dev.plist` (dev)
4. **Bundle IDs**:
   - Prod: `com.chatscommerce.app`
   - Dev: `com.chatscommerce.app.dev`

### Firebase Packages

- `@react-native-firebase/app` - Core Firebase
- `@react-native-firebase/messaging` - Cloud Messaging
- `@notifee/react-native` - Local notification display

### Configuration

- `app.config.ts` resolves Firebase files based on environment
- Priority: EAS Secret File env var → Credentials directory → Native directory
- Custom plugin: `./plugins/with-notifee-maven` applies Notifee Maven fix

## Performance Best Practices

1. **Minimize Re-renders**: Use `React.memo`, `useMemo`, `useCallback` appropriately
2. **List Performance**: Use `@shopify/flash-list` instead of `FlatList`
3. **Image Optimization**: Use `expo-image` with lazy loading
4. **Cleanup**: Always cleanup timers, intervals, subscriptions in `useEffect` return
5. **Debugging**: Enable Why-Did-You-Render in development to identify unnecessary renders
6. **State Updates**: Use Redux selectors to prevent unnecessary re-renders
7. **Bundle Size**: Check bundle with `npx react-native bundle-visualizer`

## Troubleshooting

### Metro Bundler Stuck
```bash
pnpm run clean            # Clean watchman + cache
pnpm start --clear        # Clear Metro cache
```

### Environment Variable Mismatch
- Redux automatically overrides on launch (check logs for 🚨 ENVIRONMENT MISMATCH)
- Re-run `./scripts/pull-env.sh {environment}` to refresh

### Native Code Not Updating
```bash
pnpm run generate         # Clean prebuild
```

### Android Build Failures
- Check `ANDROID_HOME` environment variable
- Verify Android SDK installed (API 24-35)
- Ensure device/emulator running

### iOS Build Failures
- Update Xcode to latest
- Clear derived data: Xcode → Product → Clean Build Folder
- Verify bundle ID matches certificates

### 401 Errors
- APIService auto-logs out on 401
- Check if token expired or server changed
- Clear app data and re-login

### WebSocket Not Connecting
- Check `settings.installationUrl` in Redux state
- Verify `pubsub_token` in auth state
- Check network connectivity
- Look for ActionCable logs in Metro

## Key Files Reference

- `app.config.ts` - Expo config with environment-specific settings
- `eas.json` - EAS Build/Submit profiles
- `src/store/index.ts` - Redux store setup, persistence, migration
- `src/store/reducers.ts` - Combined reducers
- `src/services/APIService.ts` - Axios singleton with interceptors
- `src/utils/actionCable.ts` - WebSocket event handlers
- `src/navigation/index.tsx` - Navigation config
- `src/theme/tailwind.config.ts` - Tailwind theme
- `babel.config.js` - Babel with Why-Did-You-Render
- `jest.config.js` - Jest test configuration

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Chatwoot Documentation](https://www.chatwoot.com/docs/)
- [Chatwoot Discord](https://discord.gg/cJXdrwS)
