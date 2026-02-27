# Clean Architecture Reference

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

```
src/
  types/                    # Shared TypeScript types and constants (no business logic)
  store/                    # Redux state: slices, actions, selectors, services, schemas
    ai-chat/                #   Modern pattern reference implementation
    conversation/           #   Existing feature module
  services/                 # Shared service utilities (APIService)
  presentation/             # UI layer: containers, components, parts, hooks, styles
  domain/                   # Domain interfaces (shared only -- repositories, services)
  infrastructure/           # External integrations (shared only -- repos, analytics)
  dependency-injection/     # tsyringe DI container (shared tokens only)
  screens/                  # Screen-level components
  navigation/               # React Navigation configuration
  context/                  # React Context providers
  theme/                    # Radix-based theme system
  components-next/          # Shared UI components (Avatar, Icon)
  hooks/                    # Global React hooks
  utils/                    # Global utility functions
  constants/                # App-wide constants
  i18n/                     # Internationalization
```

| Layer | Location | Responsibility | Can import from |
|-------|----------|---------------|-----------------|
| **Types** | `src/types/` | Shared type definitions, constants, enums | Nothing app-specific |
| **Store** | `src/store/<feature>/` | State management, API calls, data transforms | Types, Services |
| **Services** | `src/services/` | HTTP client, shared utilities | Nothing app-specific |
| **Presentation** | `src/presentation/` | UI rendering, user interaction | Store (via hooks/selectors), Types |
| **Domain** | `src/domain/` | Interfaces for shared infrastructure | Nothing |
| **Infrastructure** | `src/infrastructure/` | Repository implementations, analytics | Domain interfaces |
| **DI** | `src/dependency-injection/` | Container config, token registry | Domain, Infrastructure |

---

## 3. The Modern Pattern (Recommended)

**Flow**: `Service -> Actions (async thunks) -> Slice -> Selectors`

Co-located under `src/store/<feature>/` with this file structure:

```
src/store/<feature>/
  <feature>Schemas.ts       # Zod schemas for API responses, inferred types
  <feature>Types.ts          # Redux state shape, payload types, re-exports schema types
  <feature>Mapper.ts         # Pure DTO -> UI model transforms (if needed)
  <feature>Service.ts        # Static class, API calls via apiService
  <feature>Actions.ts        # createAsyncThunk calls
  <feature>Slice.ts          # createSlice with reducers + extraReducers
  <feature>Selectors.ts      # Memoized selectors (createSelector)
  index.ts                   # Barrel export
```

Reference implementation: `src/store/ai-chat/`

### 3.1 Schemas -- Zod as single source of truth

Define API response shapes as Zod schemas. Infer TypeScript types from them. Provide parse functions for runtime validation. See `src/store/ai-chat/aiChatSchemas.ts`.

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

Redux state shape and action payload interfaces. Re-export schema-inferred types so consumers have a single import source. See `src/store/ai-chat/aiChatTypes.ts`.

### 3.3 Service -- static class, no DI

A static class wrapping `apiService` calls. Matches the existing `ConversationService` pattern (`src/store/conversation/conversationService.ts`). See `src/store/ai-chat/aiChatService.ts`.

```typescript
export class AIChatService {
  static async fetchBots(): Promise<AIChatBotsResponse> {
    const response = await apiService.get<AIChatBotsResponse>('ai_chat/bots');
    return response.data;
  }
}
```

### 3.4 Actions -- async thunks with error factory

Use `createAsyncThunk` with a factory helper for consistent `AxiosError` extraction. See `src/store/ai-chat/aiChatActions.ts`.

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

Standard RTK slice. Sync reducers for local state changes, `extraReducers` for thunk lifecycle (pending/fulfilled/rejected). Always read `action.payload?.message` first in rejected handlers, falling back to `action.error?.message`. See `src/store/ai-chat/aiChatSlice.ts`.

### 3.6 Selectors -- memoized with stable references

Use `createSelector`. Declare module-level empty array constants (`const EMPTY: T[] = []`) and return them from selectors when data is absent to prevent re-renders. See `src/store/ai-chat/aiChatSelectors.ts`.

### 3.7 Barrel export

Every feature module has an `index.ts` re-exporting its public API. Consumers import from the barrel. See `src/store/ai-chat/index.ts`.

---

## 4. The Legacy Pattern (DI/tsyringe)

**Flow**: `Domain interfaces -> Application use cases -> Infrastructure repositories -> DI container`

Currently used only by the onboarding module. What remains:

| Directory | Contents |
|-----------|----------|
| `src/domain/interfaces/repositories/shared/` | `IAuthRepository`, `ISettingsRepository`, `IStateRepository` |
| `src/domain/interfaces/services/shared/` | Shared service interfaces |
| `src/infrastructure/repositories/shared/` | Redux-backed repository implementations |
| `src/infrastructure/services/shared/` | `FirebaseAnalyticsService` |
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

New slices register in `src/store/reducers.ts`. `RootState` is inferred from `appReducer` in `src/store/index.ts`.

---

## 6. Presentation Layer

### 6.1 Component Hierarchy

| Type | Location | Responsibility |
|------|----------|---------------|
| **Containers** | `presentation/containers/<feature>/` | Orchestrate hooks, compose components |
| **Components** | `presentation/components/<feature>/` | Render UI, receive data via props |
| **Parts** | `presentation/parts/<feature>/` | Render sub-elements (text part, tool part) |
| **Hooks** | `presentation/hooks/<feature>/` | Business logic, store connection, side effects |
| **Styles** | `presentation/styles/<feature>/` | Shared style constants |
| **Utils** | `presentation/utils/<feature>/` | Pure helper functions |

### 6.2 Data Flow

```
Store (Redux) -> Selectors -> Hooks -> Container -> Components -> Parts
```

Containers use `useAppSelector`/`useAppDispatch`. Components receive data via props and are state-unaware.

### 6.3 Hook Design

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
| Store feature dir | `src/store/<kebab-case>/` | `src/store/ai-chat/` |
| Slice file | `<camelCase>Slice.ts` | `aiChatSlice.ts` |
| Actions | `<camelCase>Actions.ts` | `aiChatActions.ts` |
| Selectors | `<camelCase>Selectors.ts` | `aiChatSelectors.ts` |
| Service | `<camelCase>Service.ts` | `aiChatService.ts` |
| Types | `<camelCase>Types.ts` | `aiChatTypes.ts` |
| Schemas | `<camelCase>Schemas.ts` | `aiChatSchemas.ts` |
| Container/Component | `PascalCase.tsx` | `AIChatInterface.tsx` |
| Hook | `use<PascalCase>.ts` | `useAIChatSessions.ts` |
| Presentation dirs | `presentation/<type>/<kebab-case>/` | `hooks/ai-assistant/` |

Use the `@/` path alias (maps to `src/`). Prefer barrel imports:

```typescript
import { aiChatActions, selectSessionsByAgentBot } from '@/store/ai-chat';
```

---

## 8. Dependency Rules

Dependencies point inward. Outer layers depend on inner layers, never the reverse.

```
Presentation -> Store -> Services -> (nothing app-specific)
                  |
                  +--> Types (pure types, no logic)
```

| From | Can import | Cannot import |
|------|-----------|---------------|
| `types/` | External packages only | Anything in `src/` |
| `store/<feature>/` | `types/`, `services/`, `store/storeAccessor` | `presentation/`, `screens/` |
| `services/` | `store/storeAccessor` (for auth headers) | `presentation/`, `store/<feature>/` |
| `presentation/` | `store/`, `types/`, `hooks/`, `utils/` | `domain/`, `infrastructure/` |
| `domain/` | Nothing app-specific | Everything else |
| `infrastructure/` | `domain/` interfaces | `store/`, `presentation/` |

Store features should not import from other store features. Share data via selectors in components, shared thunks, or types in `src/types/`.

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

1. **Create store module** -- `src/store/<feature>/` with 8 files per Section 3
2. **Move types** -- Domain entities/value objects become Zod schemas; delete interfaces
3. **Replace use cases with thunks** -- Each use case class becomes a `createAsyncThunk` calling the service directly
4. **Replace repository with service** -- DI repository -> static service class using `apiService`
5. **Update presentation** -- Remove factories, DI hooks; update imports to `@/store/<feature>/`; replace `Result` with try/catch
6. **Clean up DI** -- Remove tokens, module registration, module file
7. **Delete orphans** -- `domain/entities/<feature>/`, `domain/value-objects/<feature>/`, `domain/errors/<feature>/`, `domain/interfaces/*/<feature>/`, `application/use-cases/<feature>/`, `infrastructure/{repositories,services,mappers,dto,state}/<feature>/`, test files
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
