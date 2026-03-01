# Clean Architecture Reference

> **Last Updated**: March 1, 2026  
> Canonical architecture guide for the chatwoot-mobile-app repository.  
> React Native + Expo SDK 52 | TypeScript | Redux Toolkit | Zod

---

## 1. Overview

This app applies Clean Architecture pragmatically. The guiding principle is **simplicity over purity**: every abstraction must earn its place by reducing complexity, not by satisfying a textbook diagram.

Two architectural patterns coexist:

| Pattern | Used by | Status |
|---------|---------|--------|
| **Modern** (Service -> Actions -> Slice -> Selectors) | AI chat, recommended for all new features | Active, preferred |
| **Legacy** (Domain -> Use Cases -> Repositories -> DI) | Onboarding module (tsyringe) | Maintained, not extended |

The modern pattern was adopted after the AI chat simplification reduced 85 files to 11 with no loss of functionality. New features must use the modern pattern unless there is a documented reason to deviate.

---

## 2. Layer Definitions

### 2.1 Folder Structure Overview

```
src/
  # Domain Layer (Pure Business Logic)
  domain/                   # Entities, types, constants (NO React, NO external deps)
    entities/               #   Business entities (User, Conversation, Message)
    types/                  #   Business type definitions
    interfaces/             #   Shared interfaces (TransportConfig, SessionsAdapter)
    constants/              #   Business constants (PART_TYPES, CHAT_STATUS)
  
  # Infrastructure Layer (Framework-Dependent)
  infrastructure/           # All framework-dependent utilities & integrations
    ui/                     #   Shared UI components (Avatar, Icon, Button)
    utils/                  #   Utility functions
    hooks/                  #   Reusable React hooks
    theme/                  #   Design system (Radix colors, tokens)
    i18n/                   #   Internationalization
    analytics/              #   Analytics services
    errors/                 #   Error handling utilities
  
  # Application Layer (State & Navigation)
  application/              # App orchestration
    store/                  #   Redux state: slices, actions, selectors, services, schemas
      ai-chat/              #     Modern pattern reference implementation
      conversation/         #     Existing feature module
    navigation/             #   React Navigation configuration
  
  # Presentation Layer (Screens & UI)
  screens/                  # Screen-level components (all features except AI chat)
  presentation/             # AI chat UI ONLY (extraction-ready)
    ai-chat/                #   AI assistant containers, components, hooks, parts
  
  # Legacy (DI Pattern - Maintained, Not Extended)
  services/                 # Shared service utilities (APIService)
  dependency-injection/     # tsyringe DI container (shared tokens only)
  context/                  # React Context providers
```

### 2.2 Layer Responsibility Table

| Layer | Location | Responsibility | Can import from | Examples |
|-------|----------|---------------|-----------------|----------|
| **Domain** | `domain/` | Pure business logic, entities, types, constants | Nothing (pure TypeScript) | `User.ts`, `PART_TYPES`, `TransportConfig` |
| **Infrastructure** | `infrastructure/` | Framework-dependent utilities, UI, hooks, integrations | `domain/` | `Avatar.tsx`, `useDebounce.ts`, `theme/` |
| **Application** | `application/store/`, `application/navigation/` | State management, routing, orchestration | `domain/`, `infrastructure/`, `services/` | Redux slices, React Navigation |
| **Presentation** | `screens/`, `presentation/ai-chat/` | React components, user interaction | `application/store/`, `domain/`, `infrastructure/` | Screens, containers, components |
| **Services** | `services/` | HTTP client, shared utilities | Nothing app-specific | `apiService.ts` |
| **Legacy DI** | `dependency-injection/` | DI container (shared tokens only) | `domain/` interfaces | tsyringe tokens (maintained only) |

### 2.3 Key Architectural Decisions

1. **Domain/Infrastructure Separation**: `domain/` contains **extraction-ready** business logic (no React, no external deps). `infrastructure/` contains **framework-dependent** code (React, utilities, theme, analytics). The term "infrastructure" is more accurate than "shared" per Clean Architecture terminology — it represents the outermost layer of external concerns.
2. **Application Layer Grouping**: `application/store/` and `application/navigation/` are grouped together because they're **app-specific orchestration**, not reusable infrastructure. They depend on infrastructure but are not infrastructure themselves.
3. **Presentation Constraint**: `presentation/ai-chat/` is the **AI chat UI ONLY** (extraction boundary for future `@eleva/ai-chat-core` package). All other features use `screens/<feature>/`. This explicit naming makes the extraction boundary crystal clear.

---

## 2.4 Import Rules (Enforced by ESLint)

**Dependency flow: Presentation → Application → Infrastructure → Domain**

| From | Can import | Cannot import |
|------|-----------|---------------|
| `domain/` | Nothing (pure TypeScript) | Everything else |
| `infrastructure/` | `domain/` | `application/`, `screens/`, `presentation/` |
| `application/store/`, `application/navigation/` | `domain/`, `infrastructure/`, `services/` | `screens/`, `presentation/`, other features |
| `screens/`, `presentation/ai-chat/` | `application/store/`, `domain/`, `infrastructure/`, `application/navigation/` | Other screen features |

**Feature Isolation**: Store features and screen features must not import from other feature modules. Share data via selectors, shared thunks, or `domain/` types.

---

## 3. The Modern Pattern (Recommended)

**Flow**: `Service -> Actions (async thunks) -> Slice -> Selectors`

Co-located under `src/application/store/<feature>/` with this file structure:

```
src/application/store/<feature>/
  <feature>Schemas.ts       # Zod schemas for API responses, inferred types
  <feature>Types.ts          # Redux state shape, payload types, re-exports schema types
  <feature>Mapper.ts         # Pure DTO -> UI model transforms (if needed)
  <feature>Service.ts        # Static class, API calls via apiService
  <feature>Actions.ts        # createAsyncThunk calls
  <feature>Slice.ts          # createSlice with reducers + extraReducers
  <feature>Selectors.ts      # Memoized selectors (createSelector)
  index.ts                   # Barrel export
```

Reference implementation: `src/application/store/ai-chat/`

### 3.1 Schemas -- Zod as single source of truth

Define API response shapes as Zod schemas. Infer TypeScript types from them. Provide parse functions for runtime validation. See `src/application/store/ai-chat/aiChatSchemas.ts`.

```typescript
export const AIChatBotApiSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar_url: z.string().optional(),
});
export type AIChatBot = z.infer<typeof AIChatBotApiSchema>;
export const parseBotsResponse = (raw: unknown) => AIChatBotsResponseSchema.parse(raw);
```

### 3.2 Types -- Redux state and payloads

Redux state shape and action payload interfaces. Re-export schema-inferred types so consumers have a single import source. See `src/application/store/ai-chat/aiChatTypes.ts`.

### 3.3 Service -- static class, no DI

A static class wrapping `apiService` calls. Matches the existing `ConversationService` pattern (`src/application/store/conversation/conversationService.ts`). See `src/application/store/ai-chat/aiChatService.ts`.

```typescript
export class AIChatService {
  static async fetchBots(): Promise<AIChatBotsResponse> {
    const response = await apiService.get<AIChatBotsResponse>('ai_chat/bots');
    return response.data;
  }
}
```

### 3.4 Actions -- async thunks with error factory

Use `createAsyncThunk` with a factory helper for consistent `AxiosError` extraction. See `src/application/store/ai-chat/aiChatActions.ts`.

```typescript
const createAIChatThunk = <TResponse, TPayload = void>(type, handler) =>
  createAsyncThunk<TResponse, TPayload, { rejectValue: AIChatErrorPayload }>(
    type,
    async (payload, { rejectWithValue }) => {
      try { return await handler(payload); }
      catch (error) { /* extract AxiosError, rejectWithValue */ }
    },
  );
```

### 3.5 Slice -- reducers + extraReducers

Standard RTK slice. Sync reducers for local state changes, `extraReducers` for thunk lifecycle (pending/fulfilled/rejected). Always read `action.payload?.message` first in rejected handlers, falling back to `action.error?.message`. See `src/application/store/ai-chat/aiChatSlice.ts`.

### 3.6 Selectors -- memoized with stable references

Use `createSelector`. Declare module-level empty array constants (`const EMPTY: T[] = []`) and return them from selectors when data is absent to prevent re-renders. See `src/application/store/ai-chat/aiChatSelectors.ts`.

### 3.7 Barrel export

Every feature module has an `index.ts` re-exporting its public API. Consumers import from the barrel. See `src/application/store/ai-chat/index.ts`.

---

## 4. The Legacy Pattern (DI/tsyringe)

**Flow**: `Domain interfaces -> Application use cases -> Infrastructure repositories -> DI container`

Currently used only by the onboarding module. What remains:

| Directory | Contents |
|-----------|----------|
| `src/domain/interfaces/repositories/shared/` | `IAuthRepository`, `ISettingsRepository`, `IStateRepository` (legacy) |
| `src/domain/interfaces/services/shared/` | Shared service interfaces (legacy) |
| `src/infrastructure/analytics/` | `FirebaseAnalyticsService` and other analytics services |
| `src/dependency-injection/tokens.ts` | `SHARED_TOKENS` (3 tokens) |
| `src/dependency-injection/modules/shared.module.ts` | Registers shared repos |
| `src/dependency-injection/bootstrap.ts` | Called from `app.tsx` after `reflect-metadata` |

**Do not extend.** Do not add new tokens, use cases, or repositories to the DI system. It exists solely to support onboarding until it is migrated.

---

## 5. State Management

| Mechanism | Use when | Examples |
|-----------|----------|---------|
| **Redux slice** | Shared across screens, persisted, or multi-component | Sessions, messages, auth |
| **React Context** | Theme, locale, provider-scoped | `ThemeContext` |
| **Local state** (`useState`) | UI-only, single component | Form input, toggle |
| **Refs** (`useRef`) | Must not trigger re-renders | Scroll position, streaming session ID, callback refs |

New slices register in `src/application/store/reducers.ts`. `RootState` is inferred from `appReducer` in `src/application/store/index.ts`.

---

## 6. Presentation Layer

### 6.1 Two UI Patterns

| Pattern | Location | Features | Status |
|---------|----------|----------|--------|
| **AI Chat** | `presentation/ai-chat/` | AI chat only | Extraction-ready for `@eleva/ai-chat-core` |
| **Feature UIs** | `screens/<feature>/` | All other features | ✅ Canonical pattern for new features |

**Rule**: New features use `screens/<feature>/`. Only AI chat uses `presentation/ai-chat/`. The explicit `ai-chat/` subdirectory makes the extraction boundary unmistakable.

### 6.2 Component Hierarchy

#### AI Chat Pattern (presentation/ai-chat/)

| Type | Location | Responsibility |
|------|----------|---------------|
| **Containers** | `presentation/ai-chat/containers/` | Orchestrate hooks, compose components |
| **Components** | `presentation/ai-chat/components/` | Render UI, receive data via props |
| **Parts** | `presentation/ai-chat/parts/` | Render sub-elements (text part, tool part) |
| **Hooks** | `presentation/ai-chat/hooks/` | Business logic, store connection, side effects |
| **Styles** | `presentation/ai-chat/styles/` | Shared style constants |
| **Utils** | `presentation/ai-chat/utils/` | Pure helper functions |

#### Feature UI Pattern (screens/)

| Type | Location | Responsibility |
|------|----------|---------------|
| **Screen** | `screens/<feature>/<Feature>Screen.tsx` | Entry point, orchestrates hooks/components |
| **Components** | `screens/<feature>/components/` | Feature-specific UI components |
| **Hooks** | `screens/<feature>/hooks/` | Feature-specific business logic |
| **Utils** | `screens/<feature>/utils/` | Feature-specific utilities |
| **Types** | `screens/<feature>/types.ts` | Feature-specific type definitions |

### 6.3 Data Flow

```
Store (Redux) -> Selectors -> Hooks -> Container/Screen -> Components -> Parts
```

Containers/screens use `useAppSelector`/`useAppDispatch`. Components receive data via props and are state-unaware.

### 6.4 Hook Design

Each hook encapsulates one concern. Example from AI chat:

| Hook | Concern |
|------|---------|
| `useAIChat` | Wraps Vercel AI SDK `useChat`, manages transport/streaming |
| `useAIChatSessions` | Session CRUD, message bridging between Redux and SDK |
| `useAIChatBot` | Bot selection and avatar data |
| `useAIChatScroll` | Auto-scroll, scroll-to-top/bottom |

---

## 7. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| **Domain dirs** | `domain/<layer>/<kebab-case>/` | `domain/entities/user/` |
| **Infrastructure dirs** | `infrastructure/<category>/<kebab-case>/` | `infrastructure/ui/button/` |
| **Store feature dir** | `application/store/<kebab-case>/` | `application/store/ai-chat/` |
| **Screen feature dir** | `screens/<kebab-case>/` | `screens/conversations/` |
| Slice file | `<camelCase>Slice.ts` | `aiChatSlice.ts` |
| Actions | `<camelCase>Actions.ts` | `aiChatActions.ts` |
| Selectors | `<camelCase>Selectors.ts` | `aiChatSelectors.ts` |
| Service | `<camelCase>Service.ts` | `aiChatService.ts` |
| Types | `<camelCase>Types.ts` | `aiChatTypes.ts` |
| Schemas | `<camelCase>Schemas.ts` | `aiChatSchemas.ts` |
| Container/Component | `PascalCase.tsx` | `AIChatInterface.tsx` |
| Screen component | `<PascalCase>Screen.tsx` | `ConversationsScreen.tsx` |
| Hook | `use<PascalCase>.ts` | `useAIChatSessions.ts` |
| Presentation dirs | `presentation/ai-chat/<type>/` | `presentation/ai-chat/hooks/` |

### Path Aliases (Enforced)

Use the `@/` path alias (maps to `src/`). ESLint blocks relative imports beyond parent directory.

```typescript
// ✅ Correct
import { aiChatActions } from '@/application/store/ai-chat';
import { User } from '@/domain/entities/user';
import { Avatar } from '@/infrastructure/ui/avatar';

// ❌ Wrong (ESLint error)
import { aiChatActions } from '../../../application/store/ai-chat';
```

Prefer barrel imports:

```typescript
import { aiChatActions, selectSessionsByAgentBot } from '@/application/store/ai-chat';
```

---

## 8. Dependency Rules

Dependencies point inward. Outer layers depend on inner layers, never the reverse.

```
Presentation (screens/, presentation/ai-chat/)
    ↓
Application (application/store/, application/navigation/)
    ↓
Infrastructure (infrastructure/)
    ↓
Domain (domain/)  ← Innermost layer (pure TypeScript)
```

### 8.1 Clean Architecture Layer Mapping

| Clean Architecture Layer | This Codebase | Dependency Direction |
|--------------------------|---------------|---------------------|
| **Presentation** | `screens/`, `presentation/ai-chat/` | Can import from all layers below |
| **Application** | `application/store/`, `application/navigation/` | Can import: Infrastructure, Domain |
| **Infrastructure** | `infrastructure/`, `services/` | Can import: Domain only |
| **Domain** | `domain/` | Imports nothing from `src/` |

### 8.2 Import Rules (Detailed)

| From | Can import | Cannot import |
|------|-----------|---------------|
| `domain/` | External packages only (no React) | Anything in `src/` |
| `infrastructure/` | `domain/` | `application/`, `screens/`, `presentation/` |
| `application/store/<feature>/` | `domain/`, `infrastructure/`, `services/` | `screens/`, `presentation/`, other `application/store/<feature>/` modules |
| `application/navigation/` | `domain/`, `infrastructure/` | `application/store/`, `screens/`, `presentation/` |
| `screens/<feature>/` | `application/store/`, `domain/`, `infrastructure/`, `application/navigation/` | Other `screens/<feature>/` modules |
| `presentation/ai-chat/` | `application/store/`, `domain/`, `infrastructure/`, `application/navigation/` | `screens/` |
| `services/` | `application/store/storeAccessor` (for auth headers) | `presentation/`, `application/store/<feature>/` |

### 8.3 Feature Isolation Rule

**Store features and screen features must not import from other feature modules.** This is enforced by ESLint `no-restricted-imports`. Share data via:

- **Selectors** (consumed in components)
- **Shared thunks** (exported from `index.ts`)
- **Shared types** (`domain/types/` or `domain/entities/`)

```typescript
// ❌ Wrong: Cross-feature import
import { conversationActions } from '@/application/store/conversation';

// ✅ Correct: Share via domain types
import { Conversation } from '@/domain/entities/conversation';
```

---

## 9. Testing

| Layer | Test type | Focus |
|-------|-----------|-------|
| Schemas | Unit | Parse valid/invalid responses, Zod transforms |
| Mapper | Unit | DTO -> UI model, edge cases |
| Service | Integration (mocked) | Endpoints, params, response handling |
| Actions | Unit (mocked service) | Correct dispatches on success/failure |
| Slice | Unit | Reducers produce correct state |
| Selectors | Unit | Memoization, stable refs |
| Hooks | Integration | Dispatches, state reads, side effects |
| Components | Snapshot/interaction | Rendering, user events |

Tests mirror source structure under `src/__tests__/`. Run with `task test`.

---

## 10. Migration: Legacy DI to Modern Pattern

1. **Create store module** -- `src/application/store/<feature>/` with 8 files per Section 3
2. **Move types** -- Domain entities/value objects become Zod schemas; delete interfaces
3. **Replace use cases with thunks** -- Each use case class becomes a `createAsyncThunk` calling the service directly
4. **Replace repository with service** -- DI repository -> static service class using `apiService`
5. **Update presentation** -- Remove factories, DI hooks; update imports to `@/application/store/<feature>/`; replace `Result` with try/catch
6. **Clean up DI** -- Remove tokens, module registration, module file
7. **Delete orphans** -- `domain/entities/<feature>/`, `domain/value-objects/<feature>/`, `domain/errors/<feature>/`, `domain/interfaces/*/<feature>/`, `application/use-cases/<feature>/` (old location), test files
8. **Verify** -- `npx tsc --noEmit` (zero errors), grep for deleted paths (zero hits), `task test` (all pass)

---

## 11. Decision Record: Why the Modern Pattern

**Date**: February 2026

**Context**: The AI chat module was initially built with full Clean Architecture and tsyringe DI, producing ~85 files across 7 abstraction layers.

**Problem**: For a mobile app consuming a REST API, the layers added indirection without value. Repositories were 1:1 API wrappers with no alternate implementations. Use cases were pass-through functions. Value objects wrapped primitives with no validation. The `Result` pattern added ceremony to every call site. DI tokens duplicated what TypeScript already provides.

**Decision**: Adopt `Service -> Actions -> Slice -> Selectors`, matching the existing `ConversationService`/`conversationActions` pattern. Add Zod schemas for runtime validation (which the legacy pattern lacked).

| Metric | Legacy | Modern |
|--------|--------|--------|
| Files | ~85 | ~11 |
| Abstraction layers | 7 | 3 |
| Lines of code | ~3,500 | ~800 |
| Runtime API validation | None | Zod schemas |
| Consistency with app | Low (unique DI pattern) | High (matches conversation, auth, etc.) |

**Tradeoff**: If a feature genuinely needs polymorphic implementations (e.g., swapping SQLite for a remote API), the DI pattern is more appropriate. No current or planned feature requires this.

---

## 12. Domain vs. Infrastructure: What Goes Where?

This section provides decision trees to determine correct file placement in the `domain/` + `shared/` structure.

### 12.1 Decision Tree: Types & Entities

```
START: Where does this type/entity go?
  ↓
Is this a business entity (User, Conversation, Message)?
  ├─ YES → domain/entities/<entity>/
  └─ NO → Continue
      ↓
Is this a business constant (MAX_MESSAGE_LENGTH, PART_TYPES)?
  ├─ YES → domain/constants/
  └─ NO → Continue
      ↓
Is this a shared interface (TransportConfig, SessionsAdapter)?
  ├─ YES → domain/interfaces/
  └─ NO → Continue
      ↓
Is this a Redux state type (ConversationState)?
  ├─ YES → store/<feature>/<feature>Types.ts
  └─ NO → Continue
      ↓
Is this a UI prop type (ButtonProps, AvatarProps)?
  ├─ YES → infrastructure/ui/<component>/<Component>.tsx (inline)
  └─ NO → domain/types/ (shared business type)
```

### 12.2 Decision Tree: UI Components

```
START: Where does this UI component go?
  ↓
Is this AI chat related?
  ├─ YES → presentation/ai-chat/components/
  └─ NO → Continue
      ↓
Is this a primitive shared across 3+ features?
  (Avatar, Button, Icon, Badge)
  ├─ YES → infrastructure/ui/<component>/
  └─ NO → Continue
      ↓
Is this a navigational screen?
  ├─ YES → screens/<feature>/<Feature>Screen.tsx
  └─ NO → Continue
      ↓
Is this used ONLY in one feature?
  ├─ YES → screens/<feature>/components/
  └─ NO → infrastructure/ui/common/ (if truly shared but not a primitive)
```

### 12.3 Decision Tree: Utilities & Hooks

```
START: Where does this utility/hook go?
  ↓
Is this AI chat related?
  ├─ YES → presentation/ai-chat/hooks/ OR presentation/ai-chat/utils/
  └─ NO → Continue
      ↓
Is this pure business logic (no React, no external deps)?
  ├─ YES → domain/entities/<entity>/lib.ts (if entity-specific)
  │        OR domain/utils/ (if cross-entity)
  └─ NO → Continue
      ↓
Is this a React hook?
  ├─ YES → infrastructure/hooks/ (if global) OR screens/<feature>/hooks/ (if feature-specific)
  └─ NO → Continue
      ↓
Is this used in 3+ features?
  ├─ YES → infrastructure/utils/
  └─ NO → screens/<feature>/utils/ (feature-specific)
```

### 12.4 Real-World Examples

| Code | Goes In | Reasoning |
|------|---------|-----------|
| `class User { id, email, name }` | `domain/entities/user/` | Business entity, no React |
| `PART_TYPES = { TEXT, TOOL }` | `domain/constants/` | Business constant, extraction-ready |
| `interface TransportConfig` | `domain/interfaces/` | Shared with web (extraction-ready) |
| `Avatar.tsx` | `infrastructure/ui/avatar/` | React component, uses theme |
| `useDebounce()` | `infrastructure/hooks/` | React hook, framework-dependent |
| `formatDate()` | `infrastructure/utils/` | Framework-dependent (uses locale) |
| `conversationSlice.ts` | `application/store/conversation/` | Redux slice, app-specific |
| `ConversationsScreen.tsx` | `screens/conversations/` | Screen component, uses Redux |

### 12.5 Key Principles

1. **Domain = Extraction-Ready**: If code will be extracted to `@eleva/ai-chat-core`, it belongs in `domain/`
2. **No React in Domain**: `domain/` contains zero React imports (pure TypeScript)
3. **Infrastructure = Framework-Dependent**: `infrastructure/` contains framework-dependent utilities (React, theme, i18n, analytics). This is the correct Clean Architecture term — the outermost layer handling external concerns.
4. **Application = Orchestration**: `application/store/` and `application/navigation/` orchestrate the app using infrastructure, but are not reusable infrastructure themselves

---

## 13. ESLint Enforcement

The `domain/` + `infrastructure/` + `application/` structure is enforced via ESLint to prevent architecture violations.

### 13.1 Enforced Rules

```javascript
// eslint.config.mjs
export default {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // Block domain from importing anything in src/
        {
          group: ['@/infrastructure/*', '@/application/*', '@/screens/*', '@/presentation/*'],
          message: 'Domain layer cannot import from infrastructure or application layers'
        },
        // Block infrastructure from importing application layers
        {
          group: ['@/application/*', '@/screens/*', '@/presentation/*'],
          message: 'Infrastructure cannot import from application layer'
        },
        // Block application from importing presentation
        {
          group: ['@/screens/*', '@/presentation/*'],
          message: 'Application layer cannot import from presentation layer'
        },
        // Block cross-feature imports
        {
          group: ['@/screens/*/!(components|hooks|utils|types)', '@/application/store/*/!(index)'],
          message: 'Do not import screen or store entry points from other features'
        },
        // Block relative imports beyond parent
        {
          group: ['../*', '../../*', '../../../*'],
          message: 'Use path aliases (@/) instead of deep relative imports'
        }
      ]
    }]
  }
};
```

### 13.2 What Gets Blocked

```typescript
// ❌ Blocked: Domain importing infrastructure
// domain/entities/user/model.ts
import { Avatar } from '@/infrastructure/ui/avatar'; // ERROR: Domain cannot import infrastructure

// ❌ Blocked: Infrastructure importing application
// infrastructure/ui/button/Button.tsx
import { useAppSelector } from '@/application/store'; // ERROR: Infrastructure cannot import application

// ❌ Blocked: Application importing presentation
// application/store/auth/authSlice.ts
import { LoginScreen } from '@/screens/login'; // ERROR: Application cannot import presentation

// ❌ Blocked: Cross-feature screen import
// screens/chat/ChatScreen.tsx
import { ConversationsScreen } from '@/screens/conversations'; // ERROR: No cross-feature imports

// ❌ Blocked: Deep relative import
import { User } from '../../../domain/entities/user'; // ERROR: Use @/domain/entities/user
```

### 13.3 Verification

```bash
# Run ESLint to check violations
pnpm lint

# Auto-fix violations (where possible)
pnpm lint --fix

# Pre-commit hook blocks commits with violations
git commit -m "Add feature" # Fails if ESLint errors exist
```

---

## 14. Migration Guide: Legacy to Modern Structure

### 14.1 Current State (Before)

```
src/
  types/                    # Mixed domain + infrastructure types
  components-next/          # Shared UI components
  hooks/                    # Global hooks
  utils/                    # Global utilities
  theme/                    # Theme system
  i18n/                     # Internationalization
  store/<feature>/          # Redux modules
  navigation/               # React Navigation
  screens/<feature>/        # Feature screens
  presentation/ai-assistant/ # AI chat UI (legacy path)
```

### 14.2 Target State (After)

```
src/
  domain/                   # Pure business logic (extraction-ready)
    entities/
    types/
    interfaces/
    constants/
  infrastructure/           # Framework-dependent utilities
    ui/                     # (from components-next/)
    hooks/                  # (from hooks/)
    utils/                  # (from utils/)
    theme/                  # (from theme/)
    i18n/                   # (from i18n/)
    analytics/              # Analytics services
    errors/                 # Error handling
  application/              # App orchestration
    store/<feature>/        # (from store/)
    navigation/             # (from navigation/)
  screens/<feature>/        # (unchanged)
  presentation/ai-chat/     # (from presentation/ai-assistant/)
```

### 14.3 Migration Steps

**Step 1: Create Domain Folder Structure** (5 minutes)
```bash
mkdir -p src/domain/entities
mkdir -p src/domain/types
mkdir -p src/domain/interfaces
mkdir -p src/domain/constants
```

**Step 2: Identify Extraction-Ready Code** (30 minutes)

Ask for each file in `types/`, `utils/`, `constants/`:
- Does this have React imports? → `infrastructure/`
- Does this have external dependencies (axios, i18n)? → `infrastructure/`
- Is this pure TypeScript? → `domain/`

**Step 3: Move Domain Code** (1 hour)
```bash
# Move business entities
mv src/types/entities/* src/domain/entities/

# Move business constants
mv src/constants/business.ts src/domain/constants/

# Move shared interfaces (AI chat)
mv src/types/ai-chat/interfaces.ts src/domain/interfaces/
```

**Step 4: Create Infrastructure Folder Structure** (5 minutes)
```bash
mkdir -p src/infrastructure/ui
mkdir -p src/infrastructure/hooks
mkdir -p src/infrastructure/utils
mkdir -p src/infrastructure/theme
mkdir -p src/infrastructure/i18n
mkdir -p src/infrastructure/analytics
mkdir -p src/infrastructure/errors
```

**Step 5: Create Application Folder Structure** (5 minutes)
```bash
mkdir -p src/application/store
mkdir -p src/application/navigation
```

**Step 6: Move Infrastructure Code** (1 hour)
```bash
# Move UI components
mv src/components-next/* src/infrastructure/ui/

# Move hooks
mv src/hooks/* src/infrastructure/hooks/

# Move utilities
mv src/utils/* src/infrastructure/utils/

# Move theme
mv src/theme/* src/infrastructure/theme/

# Move i18n
mv src/i18n/* src/infrastructure/i18n/

# Move store
mv src/store/* src/application/store/

# Move navigation
mv src/navigation/* src/application/navigation/

# Rename AI chat presentation folder
mv src/presentation/ai-assistant src/presentation/ai-chat
```

**Step 7: Update Imports** (2-4 hours)

Use VSCode find-and-replace (RegEx mode):

| Find | Replace |
|------|---------|
| `from '@/types/entities/` | `from '@/domain/entities/` |
| `from '@/constants/business` | `from '@/domain/constants/business` |
| `from '@/components-next/` | `from '@/infrastructure/ui/` |
| `from '@/hooks/` | `from '@/infrastructure/hooks/` |
| `from '@/utils/` | `from '@/infrastructure/utils/` |
| `from '@/theme/` | `from '@/infrastructure/theme/` |
| `from '@/i18n/` | `from '@/infrastructure/i18n/` |
| `from '@/store/` | `from '@/application/store/` |
| `from '@/navigation/` | `from '@/application/navigation/` |
| `from '@/presentation/ai-assistant/` | `from '@/presentation/ai-chat/` |

**Step 8: Update Path Aliases** (5 minutes)

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/domain/*": ["src/domain/*"],
      "@/infrastructure/*": ["src/infrastructure/*"],
      "@/application/*": ["src/application/*"],
      "@/screens/*": ["src/screens/*"],
      "@/presentation/*": ["src/presentation/*"],
      "@/*": ["src/*"]
    }
  }
}
```

**Step 9: Verify** (30 minutes)

```bash
# TypeScript check
npx tsc --noEmit  # Should pass with 0 errors

# Run tests
pnpm test  # All tests should pass

# Run linter
pnpm lint  # No violations

# Run app
pnpm start  # Should start without errors
```

**Step 10: Delete Old Folders** (5 minutes)

```bash
# Only after Step 9 passes!
rm -rf src/components-next
rm -rf src/hooks
rm -rf src/utils
rm -rf src/theme
rm -rf src/i18n
# DO NOT delete src/types/ yet (has legacy code)
```

### 14.4 Total Migration Time

**Estimated: 8-10 hours** (spread over 1-2 days)

---

## 15. Extraction Readiness: Path to `@eleva/ai-chat-core`

### 15.1 What Gets Extracted

The `domain/` folder is designed to be **extraction-ready** for a future `@eleva/ai-chat-core` package shared between mobile and web.

**Extraction Target**:
```
@eleva/ai-chat-core/
  ├── entities/              # ← from domain/entities/
  ├── types/                 # ← from domain/types/
  ├── interfaces/            # ← from domain/interfaces/
  ├── constants/             # ← from domain/constants/
  └── README.md
```

**What Stays in Mobile App**:
```
chatwoot-mobile-app/src/
  ├── infrastructure/        # Platform-specific (React Native)
  ├── application/           # App orchestration
  │   ├── store/             # Redux (web uses Vuex)
  │   └── navigation/        # React Navigation (web uses Vue Router)
  ├── screens/               # Mobile screens
  └── presentation/ai-chat/  # Uses @eleva/ai-chat-core
```

### 15.2 Extraction Criteria

| Code | Extract? | Reasoning |
|------|----------|-----------|
| `domain/entities/User.ts` | ✅ YES | Pure TypeScript, no React, no platform deps |
| `domain/constants/PART_TYPES` | ✅ YES | Business constant, shared across platforms |
| `domain/interfaces/TransportConfig` | ✅ YES | Contract between core and platforms |
| `infrastructure/ui/Avatar.tsx` | ❌ NO | React Native-specific component |
| `application/store/aiChatSlice.ts` | ❌ NO | Redux-specific (web uses Vuex) |
| `infrastructure/hooks/useDebounce.ts` | ❌ NO | React hook, platform-specific |

### 15.3 Extraction Process (Future)

**Step 1: Create Package** (1 day)
```bash
# Create new package
mkdir -p packages/ai-chat-core
cd packages/ai-chat-core
pnpm init

# Copy domain code
cp -r ../../apps/mobile/src/domain/* ./src/
```

**Step 2: Configure Package** (1 day)
```json
// packages/ai-chat-core/package.json
{
  "name": "@eleva/ai-chat-core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    "./entities/*": "./dist/entities/*.js",
    "./types/*": "./dist/types/*.js",
    "./interfaces/*": "./dist/interfaces/*.js",
    "./constants/*": "./dist/constants/*.js"
  }
}
```

**Step 3: Update Mobile App** (1 day)
```typescript
// Before (internal import)
import { User } from '@/domain/entities/user';

// After (package import)
import { User } from '@eleva/ai-chat-core/entities/user';
```

**Step 4: Update Web App** (1 day)
```typescript
// chatwoot/app/javascript/dashboard/ai-chat/types.js
import { User } from '@eleva/ai-chat-core/entities/user';
import { PART_TYPES } from '@eleva/ai-chat-core/constants';
```

**Total Extraction Time: 4 days**

---

## 16. Conclusion

### 16.1 Key Takeaways

1. **Domain/Infrastructure Separation**: `domain/` = pure business logic (extraction-ready), `infrastructure/` = framework-dependent code (React, utilities, analytics). "Infrastructure" is the correct Clean Architecture term for the outermost layer.
2. **Application Layer Grouping**: `application/store/` and `application/navigation/` are grouped together as app-specific orchestration, distinct from reusable infrastructure.
3. **Presentation Constraint**: `presentation/ai-chat/` is AI chat ONLY (extraction boundary) — explicit naming prevents confusion.
4. **ESLint Enforcement**: Architecture violations are blocked at commit time.
5. **Migration Path**: 8-10 hour migration from flat structure to `domain/` + `infrastructure/` + `application/`.
6. **Extraction Readiness**: `domain/` can be extracted to `@eleva/ai-chat-core` in 4 days.

### 16.2 Why This Structure?

| Requirement | Solution |
|-------------|----------|
| **Share AI chat code between mobile and web** | `domain/` is extraction-ready (pure TypeScript) |
| **Prevent architecture violations** | ESLint blocks domain → infrastructure imports |
| **Support future monorepo** | `domain/` → `packages/ai-chat-core/` migration is trivial |
| **Modern RN patterns (2024-2026)** | Aligns with Feature-Sliced Design, Solito, Ignite |
| **Developer onboarding** | Clear boundaries: domain vs. infrastructure vs. application |
| **Accurate terminology** | "Infrastructure" matches Clean Architecture literature (Uncle Bob) better than "shared" |

### 16.3 Further Reading

- **V4 Folder Structure Research**: `docs/temp/mobile-alignment-improvements/folder-structure-v4-addendum.md`
- **Domain/Infrastructure Analysis**: `docs/temp/mobile-alignment-improvements/domain-infrastructure-separation.md`
- **Store/Navigation Placement**: `docs/temp/mobile-alignment-improvements/store-navigation-placement-analysis.md`
- **Feature-Sliced Design**: https://feature-sliced.design/
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

**Document Version**: 3.0  
**Last Updated**: March 1, 2026  
**Changes from v2.0**: 
- Renamed `shared/` → `infrastructure/` (more accurate Clean Architecture terminology)
- Grouped `store/` + `navigation/` → `application/` (app orchestration layer)
- Updated `presentation/` → `presentation/ai-chat/` (explicit extraction boundary)
- Updated all import examples, ESLint rules, decision trees, and path aliases
- Added rationale for "infrastructure" vs "shared" naming
