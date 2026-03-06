# Real-Time ActionCable Architecture

> **Status**: Proposal — covers current state (as-built), defects, and recommended target design  
> **Last Updated**: March 2026  
> **Scope**: `chatwoot-mobile-app` — ActionCable WebSocket lifecycle, reconnection, AppState, credentials, event dispatch, and testing

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Current State: What Was Built and Why](#2-current-state-what-was-built-and-why)
3. [Layer Placement Analysis](#3-layer-placement-analysis)
4. [Issue-by-Issue: Current vs. Proposed](#4-issue-by-issue-current-vs-proposed)
   - 4.1 [ActionCable lifecycle owner: AppTabs.tsx](#41-actioncable-lifecycle-owner-apptabstsx)
   - 4.2 [webSocketUrl persistence and derivation](#42-websocketurl-persistence-and-derivation)
   - 4.3 [Module-level singleton vs. managed service](#43-module-level-singleton-vs-managed-service)
   - 4.4 [AppState handling placement](#44-appstate-handling-placement)
   - 4.5 [Presence interval and background state](#45-presence-interval-and-background-state)
   - 4.6 [Reconnect strategy and catch-up fetch](#46-reconnect-strategy-and-catch-up-fetch)
   - 4.7 [MobileReconnectService placement and design](#47-mobilereconnectservice-placement-and-design)
   - 4.8 [fetchingConversations dedup Set](#48-fetchingconversations-dedup-set)
   - 4.9 [Direct store import in infrastructure](#49-direct-store-import-in-infrastructure)
5. [Proposed Target Architecture](#5-proposed-target-architecture)
   - 5.1 [File layout](#51-file-layout)
   - 5.2 [Lifecycle state machine](#52-lifecycle-state-machine)
   - 5.3 [Credential sourcing](#53-credential-sourcing)
   - 5.4 [ActionCableService](#54-actioncableservice)
   - 5.5 [useActionCable hook](#55-useactioncable-hook)
   - 5.6 [webSocketUrl computed selector (never persisted)](#56-websocketurl-computed-selector-never-persisted)
   - 5.7 [Reconnect strategy](#57-reconnect-strategy)
   - 5.8 [AppState and background handling](#58-appstate-and-background-handling)
6. [Startup Scenarios](#6-startup-scenarios)
7. [Testing Strategy](#7-testing-strategy)
8. [Migration Path](#8-migration-path)

---

## 1. System Overview

The app uses ActionCable (Rails WebSockets over `@kesha-antonov/react-native-action-cable`) to receive real-time events pushed from the Chatwoot backend. The connection subscribes to `RoomChannel` with `pubsub_token`, `account_id`, and `user_id`. Events arrive in snake_case from Rails and are transformed to camelCase via `camelCaseKeys.ts` (`camelcase-keys` with `{ deep: true }`) before being dispatched into the Redux store.

### Current file map

| File | What it does |
|------|-------------|
| `src/infrastructure/utils/baseActionCableConnector.ts` | Base class: creates `Cable` + `consumer`, registers channel, starts presence timer, exposes connect/disconnect |
| `src/infrastructure/utils/actionCable.ts` | Subclass: maps 18 event names to Redux dispatch handlers; module-level singleton `activeConnector`; `init()` / `disconnect()` API |
| `src/infrastructure/utils/reconnectService.ts` | `MobileReconnectService`: on reconnect, re-fetches conversation list and active chat screen conversation |
| `src/application/navigation/tabs/AppTabs.tsx` | **Owns the ActionCable lifecycle**: calls `actionCableConnector.init()`, wires `AppState.addEventListener` |
| `src/application/store/settings/settingsSelectors.ts` | Exposes `selectWebSocketUrl` — currently reads `state.settings.webSocketUrl` directly from persisted state |
| `src/application/store/settings/settingsSlice.ts` | Persists `webSocketUrl`; re-derives it on `persist/REHYDRATE` via `addMatcher` |
| `src/application/store/settings/settingsTypes.ts` | `InstallationUrls` type includes `webSocketUrl` — used by `setInstallationUrl` thunk |
| `src/application/store/index.ts` | Root reducer overrides `installationUrl`/`baseUrl` on `REHYDRATE` when env vars mismatch (does **not** touch `webSocketUrl` directly — that's handled by `settingsSlice`) |
| `src/infrastructure/utils/camelCaseKeys.ts` | `camelcase-keys` deep transform — converts all snake_case ActionCable event payloads to camelCase before dispatch |

---

## 2. Current State: What Was Built and Why

The bugs that were fixed are documented here because each fix reveals an underlying design tension that the proposal resolves properly.

### Bug 1: Race condition on startup (fixed)

**What happened**: The original `useEffect([], [])` in `AppTabs.tsx` ran synchronously on mount, before Redux-Persist had finished rehydrating credentials from AsyncStorage. `pubSubToken`, `accountId`, and `userId` were all `undefined`, so `actionCableConnector.init()` was called with invalid arguments.

**Fix applied**: `initActionCable` was refactored into a `useCallback` with `[pubSubToken, webSocketUrl, accountId, userId]` as dependencies, and used as the `useEffect` dependency. The effect now re-runs whenever credentials become available — which happens naturally after rehydration completes and the selectors return real values.

**Why this is still a workaround**: The correct fix is to not mount the ActionCable lifecycle inside a navigation component at all. The fix works, but it means a navigation component is now responsible for watching credential selectors and reacting to auth state changes. That is an application-layer concern, not a navigation concern.

### Bug 2: Stale persisted `webSocketUrl` (fixed)

**What happened**: `webSocketUrl` was stored in Redux-Persist (`settingsSlice`). When a user had previously connected to `wss://app.chatwoot.com/cable` and then changed their installation URL, the persisted value was still `wss://app.chatwoot.com/cable`. On the next cold start, this stale value was used for the WebSocket connection, pointing at the wrong server.

**Fix applied (double layer)**:
1. `settingsSlice.ts` `addMatcher(persist/REHYDRATE)`: re-derives `webSocketUrl` from `state.installationUrl` after rehydration.
2. `store/index.ts` `rootReducer`: detects env var mismatch on `REHYDRATE` and forcibly overrides `settings.installationUrl` and `settings.baseUrl` from `process.env`. (Note: this block does **not** directly re-derive `webSocketUrl` — that happens downstream when `settingsSlice`'s `addMatcher` runs against the already-merged state. The two fixes are coupled: `index.ts` corrects the installation URL, then `settingsSlice` re-derives the WS URL from it.)

**Why this is still a workaround**: The root problem is that `webSocketUrl` is persisted at all. It is not independent data — it is a pure deterministic derivation of `installationUrl`. The correct solution is to remove `webSocketUrl` from the persisted slice entirely and compute it as a selector. See §4.2.

### Bug 3: Event name mismatch (fixed)

**What happened**: The ActionCable library emitted `"disconnected"` but the listener registered `"disconnect"`. The disconnect handler never fired.

**Fix applied**: Changed `channel.on('disconnect', ...)` to `channel.on('disconnected', ...)` in `baseActionCableConnector.ts`.

**Root cause**: No test exercised the disconnect→reconnect lifecycle. §7 covers the required test.

### Bug 4: Module-level `Cable` instance leak (fixed)

**What happened**: The original implementation had a single `Cable` instance at module scope, shared across `ActionCableConnector` instantiations. Calling `init()` a second time (e.g., on foreground resume) created a new consumer but reused the old `Cable`, leaving stale subscriptions alive.

**Fix applied**: `Cable` instance is now created in the constructor (`this.cable = new Cable({})`), so each `ActionCableConnector` instance owns its own cable.

### Bug 5: No `disconnect()` method (fixed)

The original `BaseActionCableConnector` had no cleanup. The presence `setInterval` leaked on every re-init. Fixed by adding `disconnect()` which clears the interval and calls `this.consumer.disconnect()`.

### Bug 6–8: Missing event handlers (fixed)

`conversation.mentioned`, `first.reply.created`, `contact.deleted`, `conversation.contact_changed` were unhandled. All four added to `ActionCableConnector.events` map.

### Note: snake_case → camelCase transform layer

All ActionCable event payloads arrive from Rails in snake_case. The `ActionCableConnector` event handlers call transform functions from `camelCaseKeys.ts` (e.g., `transformMessage`, `transformConversation`, `transformContact`, `transformTypingData`) which use `camelcase-keys` with `{ deep: true }` before dispatching to Redux. **Exception**: `onPresenceUpdate` dispatches `PresenceUpdateData` **without** a camelCase transform — the payload structure uses simple key-value maps (`contacts: { [id]: status }`, `users: { [id]: status }`) that don't need conversion. This is correct behavior, not a bug, but it is an inconsistency that should be documented in the event handler table.

---

## 3. Layer Placement Analysis

The repository's clean architecture defines four layers with strict dependency rules (see `docs/architecture/clean-architecture.md` §8):

```
Presentation → Application → Infrastructure → Domain
```

Against that diagram, here is where each ActionCable component currently sits and where it **should** sit:

| Component | Current layer | Correct layer | Violation? |
|-----------|-------------|--------------|-----------|
| `baseActionCableConnector.ts` | `infrastructure/utils/` | `infrastructure/utils/` | No — framework-dependent class |
| `actionCable.ts` | `infrastructure/utils/` | `infrastructure/utils/` (connector only) + `application/store/realtime/` (event dispatch) | Partial — dispatches directly to store, imports `store` module |
| `reconnectService.ts` | `infrastructure/utils/` | `application/store/realtime/` | Yes — owns business logic (which conversations to refetch, reading navigation state) |
| ActionCable lifecycle init | `application/navigation/tabs/AppTabs.tsx` | `application/store/realtime/useRealtime.ts` hook | Yes — navigation component owns a non-navigation concern |
| `webSocketUrl` field in `settingsSlice` | `application/store/settings/` (persisted) | `settingsSelectors.ts` (computed, never stored) | Yes — derived state stored and double-re-derived on rehydrate |
| `fetchingConversations` Set | Module scope in `actionCable.ts` | Instance member on the connector class | Minor — leaks between test runs, not reset on re-init |

The most significant violation is `AppTabs.tsx` owning the WebSocket lifecycle. A navigation component should configure screens and routes — nothing else. It currently does:

- Watches auth selectors (`pubSubToken`, `userId`, `accountId`, `webSocketUrl`)
- Calls `actionCableConnector.init()` on credential change
- Registers and removes `AppState` listener
- Calls `actionCableConnector.disconnect()` on unmount

All of this is application-layer orchestration that has been placed in the presentation/navigation layer because `AppTabs.tsx` is a convenient "always mounted when logged in" component. That is the wrong reason.

---

## 4. Issue-by-Issue: Current vs. Proposed

### 4.1 ActionCable lifecycle owner: AppTabs.tsx

**Current**

```
AppTabs.tsx (navigation/tabs/)
  └── useCallback initActionCable   ← watches 4 selectors
  └── useEffect [initActionCable]   ← calls init on credential change
  └── AppState.addEventListener     ← reconnects on foreground
  └── cleanup: disconnect()
```

`AppTabs.tsx` is inside `application/navigation/`. Per `clean-architecture.md` §8.2, `application/navigation/` **should not import** `application/store/` — but `AppTabs.tsx` imports 8+ selectors from `auth`, `settings`, and `conversation` slices, and it imports `actionCableConnector` from `infrastructure/utils/`. This violates the documented architecture rule. (Note: the ESLint config in `eslint.config.mjs` does not currently enforce this specific `navigation/` → `store/` boundary — the violation is architectural, not lint-enforced. `AppTabs.tsx` is grandfathered in as a pre-existing violation.)

More fundamentally: what happens if the navigation structure changes? If `AppTabs.tsx` is replaced with a different navigator, or if the tab layout is reorganized, the WebSocket lifecycle breaks silently.

**Proposed**

Move the lifecycle out of navigation entirely. The correct owner is a dedicated custom hook that lives at `src/application/store/realtime/` and is consumed by a single point in the app — either `app.tsx` (if mounted at root level) or a thin `<RealtimeProvider>` component that renders null and is placed just inside the auth gate.

```
src/application/store/realtime/
  realtimeTypes.ts              # RealtimeConfig, ConnectionState
  realtimeService.ts            # ActionCableService (static class, wraps connector)
  realtimeSelectors.ts          # selectRealtimeConfig (computes credentials from auth + settings)
  useRealtime.ts                # Hook: wires selectors → service, AppState, cleanup

src/application/navigation/tabs/AppTabs.tsx
  (remove all ActionCable code — navigation only)
```

The hook `useRealtime()` is called from one place, passed no props, and reads everything it needs from the store. The navigation component is unaware it exists.

---

### 4.2 webSocketUrl persistence and derivation

**Current**

`settingsSlice.ts` has:

```typescript
// initialState
webSocketUrl: 'wss://app.chatwoot.com/cable',

// setInstallationUrl.fulfilled — writes webSocketUrl
state.webSocketUrl = action.payload.webSocketUrl;

// addMatcher(persist/REHYDRATE) — re-derives it
const wsProtocol = installationUrl.startsWith('https://') ? 'wss://' : 'ws://';
state.webSocketUrl = `${wsProtocol}${wsHost}/cable`;
```

And in `store/index.ts`, `rootReducer` overrides `installationUrl` and `baseUrl` on `REHYDRATE` if env vars differ (which indirectly triggers `settingsSlice`'s `addMatcher` to re-derive `webSocketUrl` from the corrected `installationUrl`).

This means `webSocketUrl` is:
- Written on `setInstallationUrl.fulfilled` (action payload includes `webSocketUrl`)
- Stored in `AsyncStorage` via Redux-Persist
- Re-derived on `REHYDRATE` in `settingsSlice`'s `addMatcher` (from `state.installationUrl`)
- Indirectly affected by `store/index.ts` `rootReducer` env-mismatch override of `installationUrl`
- Read by `selectWebSocketUrl` selector (which just returns `state.settings.webSocketUrl`)

The `selectWebSocketUrl` selector (in `settingsSelectors.ts`) currently just reads the stored field — it does no computation itself:
```typescript
export const selectWebSocketUrl = createSelector(selectSettings, settings => settings.webSocketUrl);
```

The duplication exists because the stored value can be stale. The right response to "stored value can be stale" is to not store it.

**Proposed**

Remove `webSocketUrl` from `SettingsState` entirely. Replace `selectWebSocketUrl` with a computed selector:

```typescript
// src/application/store/settings/settingsSelectors.ts

export const selectWebSocketUrl = createSelector(
  selectInstallationUrl,
  (installationUrl): string => {
    if (!installationUrl) return '';
    const wsProtocol = installationUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const wsHost = installationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${wsProtocol}${wsHost}/cable`;
  },
);
```

Remove from `SettingsState`:
- `webSocketUrl` field from `SettingsState` interface (in `settingsSlice.ts`)
- `initialState.webSocketUrl` default value
- The `state.webSocketUrl = action.payload.webSocketUrl` line in `setInstallationUrl.fulfilled`
- The `state.webSocketUrl = ...` re-derivation from the `addMatcher(persist/REHYDRATE)` block in `settingsSlice.ts`. The block also contains a `console.warn` for debugging persisted settings — that logging can be kept (just remove the `webSocketUrl` re-derivation lines) or moved to a simpler `addMatcher` that only logs.

Keep in `store/index.ts`:
- The `REHYDRATE` env-mismatch block should **remain** — it corrects `installationUrl` and `baseUrl` when env vars change. It does not touch `webSocketUrl`. With the computed selector, this block becomes even more valuable because fixing `installationUrl` automatically fixes the derived WS URL.

Also update:
- `InstallationUrls` type in `settingsTypes.ts` — remove `webSocketUrl` field
- `settingsActions.setInstallationUrl` thunk — stop returning `webSocketUrl` in the payload (it still computes it internally to validate the URL format, which is fine)

**Impact**: The `setInstallationUrl.fulfilled` action no longer receives `webSocketUrl` in its payload. The `InstallationUrls` type becomes `{ installationUrl: string; baseUrl: string }`. One less field persisted, one less re-derivation, zero staleness risk.

---

### 4.3 Module-level singleton vs. managed service

**Current**

`actionCable.ts` exports a plain object with module-level mutable state:

```typescript
let activeConnector: ActionCableConnector | null = null;

export default {
  init(...): ActionCableConnector { ... },
  disconnect() { ... },
  get isConnected(): boolean { ... },
};
```

This pattern works but has two problems:

1. **Module-level state leaks between tests.** If a test calls `init()` and doesn't call `disconnect()`, `activeConnector` persists across test files because Jest re-uses the module.
2. **The `fetchingConversations` Set is also module-level.** It is cleared in `init()`, but if `init()` is never called in a test that exercises `onMessageCreated`, the set retains stale entries.

**Proposed**

Wrap the singleton in a proper service class so state is encapsulated:

```typescript
// src/application/store/realtime/realtimeService.ts

export class ActionCableService {
  private static connector: ActionCableConnector | null = null;
  private static fetchingConversations = new Set<number>();

  static init(config: RealtimeConfig): void {
    ActionCableService.fetchingConversations.clear();
    ActionCableService.connector?.disconnect();
    ActionCableService.connector = new ActionCableConnector(
      config,
      ActionCableService.fetchingConversations,
    );
  }

  static disconnect(): void {
    ActionCableService.connector?.disconnect();
    ActionCableService.connector = null;
  }

  static get isConnected(): boolean {
    return ActionCableService.connector?.isConnected ?? false;
  }
}
```

In tests, `jest.mock('@application/store/realtime/realtimeService')` replaces the static class cleanly. No module-level state bleeds.

---

### 4.4 AppState handling placement

**Current**

`AppState.addEventListener` is called inside the `useEffect` in `AppTabs.tsx`, which is a navigation component inside `application/navigation/tabs/`. The handler references `cableConfigRef` (a `useRef` holding the latest credentials) to avoid stale closure bugs.

```typescript
const cableConfigRef = useRef({ pubSubToken, webSocketUrl, accountId, userId });
useEffect(() => {
  cableConfigRef.current = { pubSubToken, webSocketUrl, accountId, userId };
}, [pubSubToken, webSocketUrl, accountId, userId]);

useEffect(() => {
  initActionCable();
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      const { ... } = cableConfigRef.current;
      if (token && wsUrl && acctId && uid && !actionCableConnector.isConnected) {
        actionCableConnector.init({ ... });
      }
    }
  };
  const appStateSub = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    appStateSub.remove();
    actionCableConnector.disconnect();
  };
}, [initActionCable]);
```

The `cableConfigRef` is a workaround for the stale closure problem that arises from putting AppState logic inside a `useEffect` with a single dependency. It works, but it is confusing and fragile — if a new credential is added (e.g., an auth token rotation), the developer must remember to add it to `cableConfigRef.current` as well.

**Proposed**

Move `AppState` handling into `useRealtime.ts` (co-located with the realtime feature module):

```typescript
// src/application/store/realtime/useRealtime.ts

export function useRealtime(): void {
  const config = useAppSelector(selectRealtimeConfig); // { pubSubToken, webSocketUrl, accountId, userId }
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Initial connect / credentials change
  useEffect(() => {
    const { pubSubToken, webSocketUrl, accountId, userId } = config;
    if (pubSubToken && webSocketUrl && accountId && userId) {
      ActionCableService.init({ pubSubToken, webSocketUrl, accountId, userId });
    }
    return () => {
      ActionCableService.disconnect();
    };
  }, [config]);

  // Foreground resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const c = configRef.current;
        if (c.pubSubToken && c.webSocketUrl && c.accountId && c.userId
            && !ActionCableService.isConnected) {
          ActionCableService.init(c);
        }
      }
    });
    return () => subscription.remove();
  }, []); // stable: configRef never changes identity
}
```

`useRealtime()` is called from `<RealtimeGate />`, a null-rendering component placed inside the auth gate in `app.tsx`. Navigation is unaware of it.

---

### 4.5 Presence interval and background state

**Current**

The presence `setInterval` is started in the `BaseActionCableConnector` constructor and runs every 20 seconds unconditionally. It is cleared only in `disconnect()`.

When the app goes to background (`AppState` → `background`), iOS suspends the JS thread after ~30 seconds. The interval cannot fire during suspension, which is fine. But when the app returns to foreground:

- If the WebSocket was dropped during background (common after >60 seconds), `disconnect()` fires which clears the interval.
- If the WebSocket survived (short background), the interval resumes firing with no issue.

The current code does **not** pause the presence interval on `AppState === 'background'`. This is safe only because iOS actually suspends the thread. On Android, where background JS execution is more variable, the interval could fire while the WS is in a bad state.

**Proposed**

The presence interval should be aware of `AppState`. Two options:

**Option A (simple)**: Clear the interval in `handleDisconnected` and restart it in `handleConnected`. This way, presence fires only while the connection is live, regardless of AppState. The connector itself becomes the source of truth.

```typescript
private handleConnected = (): void => {
  this.connected = true;
  this.startPresenceInterval(); // starts interval
  this.reconnectService?.onReconnect().catch(console.warn);
};

private handleDisconnected = (): void => {
  this.connected = false;
  this.stopPresenceInterval(); // clears interval
  this.reconnectService?.onDisconnect();
};
```

**Option B (explicit)**: Expose `pausePresence()` / `resumePresence()` and call them from the `AppState` handler in `useRealtime.ts`.

Option A is simpler and correct: the interval should only fire when connected. There is no value in calling `update_presence` on a broken socket. **Recommendation: Option A.**

---

### 4.6 Reconnect strategy and catch-up fetch

**Current**

`MobileReconnectService.onReconnect()` runs a single catch-up fetch: re-fetch the conversation list using stored filters, and re-fetch the active ChatScreen conversation if one is open. It has no concept of how long the connection was down or whether a backoff is needed.

The ActionCable library itself handles TCP reconnection with its own internal backoff. What the app needs to handle is the data catch-up after reconnection, not the socket-level reconnect.

**Gaps in the current implementation**:

1. **No timestamp-based catch-up**: `disconnectTime` is recorded in `onDisconnect()` and used as a guard in `onReconnect()` (no-op if null), but the **duration** is never computed — `onReconnect()` re-fetches page 1 regardless of how much time passed. `disconnectTime` is cleared at the end of `onReconnect()`. This is both wasteful (reconnect after 2 seconds triggers a full page-1 re-fetch) and incomplete (if offline for 10 minutes, only page 1 is fetched).

2. **No jitter / backoff on the catch-up fetch**: If 1,000 devices reconnect simultaneously (e.g., after a server restart), all fire catch-up fetches at the same time. The backend Rails API is the bottleneck here, but the client can help by adding a small random jitter.

3. **Navigation coupling**: `MobileReconnectService` imports `navigationRef` from `navigationUtils` to detect the current route. This couples a reconnect service to the navigation system. It works, but it means the reconnect service cannot be tested without mocking the navigation ref.

**Proposed reconnect strategy**:

```typescript
async onReconnect(): Promise<void> {
  if (this.disconnectTime === null) return;

  const offlineDurationMs = Date.now() - this.disconnectTime.getTime();
  this.disconnectTime = null;

  // Jitter: 0–500ms random delay to spread reconnect storms
  const jitter = Math.random() * 500;
  await new Promise(resolve => setTimeout(resolve, jitter));

  const state = store.getState();
  const filters = selectFilters(state);

  // Always refresh page 1 of the conversation list
  await store.dispatch(conversationActions.fetchConversations({ page: 1, ...filtersFromState(filters) }));

  // If offline for more than 60s, also fetch page 2 (capture missed items)
  if (offlineDurationMs > 60_000) {
    await store.dispatch(conversationActions.fetchConversations({ page: 2, ...filtersFromState(filters) }));
  }

  // Refresh active ChatScreen conversation if open
  const conversationId = getActiveChatScreenConversationId();
  if (conversationId != null) {
    await store.dispatch(conversationActions.fetchConversation(conversationId));
  }
}
```

For the navigation coupling, pass `getActiveChatScreenConversationId` as a callback injected at construction time, rather than importing `navigationRef` directly:

```typescript
export class ActionCableReconnectService {
  constructor(
    private readonly getActiveChatConversationId: () => number | null
  ) {}
  ...
}

// In useRealtime.ts:
const getActiveChatConversationId = useCallback(() => {
  const route = navigationRef.current?.getCurrentRoute();
  if (route?.name !== 'ChatScreen') return null;
  return (route.params as { conversationId?: number })?.conversationId ?? null;
}, []);

const reconnectService = useMemo(
  () => new ActionCableReconnectService(getActiveChatConversationId),
  [getActiveChatConversationId],
);
```

This makes `ActionCableReconnectService` testable in isolation by injecting a mock callback.

---

### 4.7 MobileReconnectService placement and design

**Current**

`src/infrastructure/utils/reconnectService.ts` — placed in `infrastructure/utils/`.

**Why this placement is wrong**:

Per `clean-architecture.md` §2.2, `infrastructure/utils/` is for "utility functions" — framework-dependent helpers without app-specific business logic. `MobileReconnectService` does:

- Imports the Redux `store` directly
- Dispatches `conversationActions`
- Reads `selectFilters` from a slice
- Reads `navigationRef` to determine current screen

This is application-layer orchestration — it has significant business logic about *which data to re-fetch* based on current app state. It belongs in `application/store/realtime/`.

**Proposed**

```
src/application/store/realtime/
  realtimeReconnectService.ts    # Renamed from MobileReconnectService
```

The name `MobileReconnectService` implies it is mobile-specific. The reconnect strategy (re-fetch conversations on reconnect) is app-specific business logic, not a platform concern. The proposed name `ActionCableReconnectService` (or simply `RealtimeReconnectService`) is clearer.

**Feature isolation concern**: Per `clean-architecture.md` §8.3, store features "must not import from other feature modules." The reconnect service imports `conversationActions` and `selectFilters` from `conversation/`. This is a cross-feature import. For the initial migration, this is an acceptable pragmatic exception — the reconnect service's entire purpose is to refresh conversation data. Document this exception in the barrel `index.ts` with a comment. A future improvement could expose a generic `refetchActiveData()` thunk from a shared location.

---

### 4.8 fetchingConversations dedup Set

**Current**

```typescript
// actionCable.ts — module scope
const fetchingConversations = new Set<number>();
```

This set is cleared in `init()`. But if `onMessageCreated` fires for a conversation that is not yet in the store, and then `init()` is called again (e.g., AppState resume) before the fetch completes, the `clear()` wipes the in-flight conversation ID. The duplicate-fetch guard becomes unreliable.

**Proposed**

Move the set to the connector instance:

```typescript
class ActionCableConnector extends BaseActionCableConnector {
  private readonly fetchingConversations: Set<number>;

  constructor(config: RealtimeConfig, fetchingConversations: Set<number>) {
    super(config);
    this.fetchingConversations = fetchingConversations;
  }
}
```

`ActionCableService.init()` creates a fresh `Set` and passes it to the constructor. The old connector's in-flight fetches drain against the old set (which they hold by reference), not the new one. No race condition.

---

### 4.9 Direct store import in infrastructure

**Current**

Both `actionCable.ts` and `reconnectService.ts` import the Redux store directly:

```typescript
import { store } from '@application/store';
```

`infrastructure/` can import `application/` per the repo's rules (the "adapter pattern" exception — see `clean-architecture.md` §2.4). So this is technically not an ESLint violation. However, using the store as a global import means:

- Testability requires mocking the entire store module
- There is no way to inject a test store
- The `// TODO: Please get rid of this` comment in `store/index.ts` (on `setStore(store)`) signals this is already recognized as a smell

**Proposed**

For `ActionCableConnector` (event dispatch): inject `dispatch` and `getState` at construction time:

```typescript
class ActionCableConnector extends BaseActionCableConnector {
  constructor(
    config: RealtimeConfig,
    private readonly dispatch: AppDispatch,
    private readonly getState: () => RootState,
    fetchingConversations: Set<number>,
  ) { ... }

  private onMessageCreated = (data: Message) => {
    const message = transformMessage(data);
    this.dispatch(addOrUpdateMessage(message));
    // Check if conversation exists in store:
    const state = this.getState();
    const isLoaded = state.conversations.entities[conversationId] != null;
    // ...
  };
}
```

`ActionCableService.init()` receives `dispatch` and `getState` from the calling hook (`useAppDispatch()` + `useStore().getState`), which gets them from the Provider. This eliminates the global store import from infrastructure entirely.

For `ActionCableReconnectService`: same pattern — inject `dispatch` and `getState` via constructor.

---

## 5. Proposed Target Architecture

### 5.1 File layout

```
src/
├── application/
│   └── store/
│       └── realtime/                          # NEW feature module
│           ├── realtimeTypes.ts               # RealtimeConfig, ConnectionState
│           ├── realtimeSelectors.ts           # selectRealtimeConfig (compound selector)
│           ├── realtimeService.ts             # ActionCableService (static class, owns singleton)
│           ├── realtimeReconnectService.ts    # ActionCableReconnectService (was MobileReconnectService)
│           ├── useRealtime.ts                 # NEW: lifecycle hook (was inline in AppTabs.tsx)
│           └── index.ts                       # Barrel export
│
├── infrastructure/
│   └── utils/
│       ├── baseActionCableConnector.ts        # Base class (minimal changes)
│       └── actionCableConnector.ts            # Renamed from actionCable.ts; NO module singleton
│
└── application/
    └── navigation/
        └── tabs/
            └── AppTabs.tsx                    # CHANGED: remove all ActionCable code
```

**Layer placement rationale**:
- `realtimeService.ts` sits in `application/store/realtime/` because it imports `dispatch` and understands the application state shape.
- `useRealtime.ts` also sits in `application/store/realtime/` because it reads from `application/store/` selectors and orchestrates application-layer concerns. Placing it in `infrastructure/hooks/` would violate the dependency rule: `infrastructure/` should not import from `application/store/<feature>/` selectors (the adapter exception in §2.4 of `clean-architecture.md` applies to repository-style wrappers, not feature hooks).
- `ActionCableConnector` stays in `infrastructure/utils/` because it is a framework wrapper (ActionCable library).
- This matches the precedent set by AI chat hooks: feature-specific hooks live alongside their feature module (e.g., `presentation/hooks/ai-assistant/`).

### 5.2 Lifecycle state machine

```
                        ┌─────────────────┐
                        │    IDLE         │
                        │ (not logged in) │
                        └────────┬────────┘
                                 │ credentials available
                                 ▼
                        ┌─────────────────┐
                        │  CONNECTING     │◄────── foreground resume + not connected
                        └────────┬────────┘
                                 │ channel.on('connected')
                                 ▼
                        ┌─────────────────┐
                        │   CONNECTED     │
                        │ presence ticks  │
                        └────┬────────────┘
                             │                    │
               channel.on('disconnected')   AppState → background
                             │                    │
                             ▼                    ▼
                        ┌─────────────────┐  ┌─────────────────┐
                        │ RECONNECTING    │  │   SUSPENDED     │
                        │ (library retry) │  │ (interval paused)│
                        └────────┬────────┘  └────────┬────────┘
                                 │ reconnected              │ AppState → active
                                 │                          │ + not connected → CONNECTING
                                 ▼                          │ + connected     → CONNECTED
                        ┌─────────────────┐                │
                        │  CATCH-UP FETCH │◄───────────────┘
                        │ (onReconnect)   │
                        └────────┬────────┘
                                 │ fetch complete
                                 ▼
                        ┌─────────────────┐
                        │   CONNECTED     │
                        └─────────────────┘
```

### 5.3 Credential sourcing

**Rule: credentials are always read from the live Redux store at call time. They are never captured in a closure, cached in a ref for the purpose of constructing a URL, or derived inside the infrastructure layer.**

The single compound selector:

```typescript
// src/application/store/realtime/realtimeSelectors.ts

import { createSelector } from '@reduxjs/toolkit';
import { selectPubSubToken, selectUserId, selectCurrentUserAccountId } from '@application/store/auth/authSelectors';
import { selectWebSocketUrl } from '@application/store/settings/settingsSelectors';
import type { RealtimeConfig } from './realtimeTypes';

export const selectRealtimeConfig = createSelector(
  selectPubSubToken,
  selectWebSocketUrl,
  selectCurrentUserAccountId,
  selectUserId,
  (pubSubToken, webSocketUrl, accountId, userId): RealtimeConfig | null => {
    if (!pubSubToken || !webSocketUrl || !accountId || !userId) return null;
    return { pubSubToken, webSocketUrl, accountId, userId };
  },
);
```

Returning `null` when incomplete means the caller simply does not call `init()`. No credentials guard needed in the service. No `if (pubSubToken && webSocketUrl && ...)` scattered around.

**Referential stability**: `createSelector` memoizes its output — it returns the same object reference if all inputs are unchanged. This means `selectRealtimeConfig` won't cause unnecessary `useEffect` re-runs when unrelated state changes occur. However, when **any** credential changes (e.g., `pubSubToken` rotates), the entire config object changes reference, triggering a disconnect + reconnect cycle. This is the correct behavior — credential changes should always reconnect with fresh params.

### 5.4 ActionCableService

```typescript
// src/application/store/realtime/realtimeService.ts

import { ActionCableConnector } from '@infrastructure/utils/actionCableConnector';
import { ActionCableReconnectService } from './realtimeReconnectService';
import type { RealtimeConfig } from './realtimeTypes';
import type { AppDispatch, RootState } from '@application/store';

export class ActionCableService {
  private static connector: ActionCableConnector | null = null;

  static init(
    config: RealtimeConfig,
    dispatch: AppDispatch,
    getState: () => RootState,
    getActiveChatConversationId: () => number | null,
  ): void {
    ActionCableService.connector?.disconnect();

    const reconnectService = new ActionCableReconnectService(
      dispatch,
      getState,
      getActiveChatConversationId,
    );

    ActionCableService.connector = new ActionCableConnector(
      config,
      dispatch,
      new Set<number>(),
    );
    ActionCableService.connector.setReconnectService(reconnectService);
  }

  static disconnect(): void {
    ActionCableService.connector?.disconnect();
    ActionCableService.connector = null;
  }

  static get isConnected(): boolean {
    return ActionCableService.connector?.isConnected ?? false;
  }
}
```

### 5.5 useRealtime hook

```typescript
// src/application/store/realtime/useRealtime.ts

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useStore } from 'react-redux';
import { selectRealtimeConfig } from './realtimeSelectors';
import { ActionCableService } from './realtimeService';
import { navigationRef } from '@infrastructure/utils/navigationUtils';

export function useRealtime(): void {
  const dispatch = useAppDispatch();
  const { getState } = useStore();
  const config = useAppSelector(selectRealtimeConfig);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const getActiveChatConversationId = useCallback((): number | null => {
    const route = navigationRef.current?.getCurrentRoute();
    if (route?.name !== 'ChatScreen') return null;
    return (route.params as { conversationId?: number })?.conversationId ?? null;
  }, []);

  // Connect / reconnect when credentials change
  useEffect(() => {
    if (!config) {
      ActionCableService.disconnect();
      return;
    }
    ActionCableService.init(config, dispatch, getState, getActiveChatConversationId);
    return () => {
      ActionCableService.disconnect();
    };
  }, [config, dispatch, getState, getActiveChatConversationId]);

  // Reconnect on foreground resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      const c = configRef.current;
      if (c && !ActionCableService.isConnected) {
        ActionCableService.init(c, dispatch, getState, getActiveChatConversationId);
      }
    });
    return () => subscription.remove();
  }, [dispatch, getState, getActiveChatConversationId]);
}
```

### 5.6 webSocketUrl computed selector (never persisted)

Replace in `settingsSelectors.ts`:

```typescript
export const selectWebSocketUrl = createSelector(
  selectInstallationUrl,
  (installationUrl): string => {
    if (!installationUrl) return '';
    const wsProtocol = installationUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const wsHost = installationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${wsProtocol}${wsHost}/cable`;
  },
);
```

Remove from `SettingsState` (type, initialState, and all assignments).

Remove from `settingsActions.ts` `setInstallationUrl`:

```typescript
// BEFORE: returned { installationUrl, webSocketUrl, baseUrl }
// AFTER:  returns { installationUrl, baseUrl }
return {
  installationUrl: INSTALLATION_URL,
  baseUrl: installationUrl,
};
```

Remove the entire `addMatcher(persist/REHYDRATE)` block from `settingsSlice.ts` (it only re-derives `webSocketUrl`, which will now be a computed selector).

Keep the `REHYDRATE` env-mismatch block in `store/index.ts` — it corrects `installationUrl` and `baseUrl`, not `webSocketUrl`. It remains necessary for environment switching.

### 5.7 Reconnect strategy

```typescript
// src/application/store/realtime/realtimeReconnectService.ts

import { conversationActions } from '@application/store/conversation/conversationActions';
import { selectFilters } from '@application/store/conversation/conversationFilterSlice';
import type { AppDispatch, RootState } from '@application/store';

const CATCH_UP_THRESHOLD_MS = 30_000;  // offline > 30s triggers a second page fetch
const MAX_JITTER_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ActionCableReconnectService {
  private disconnectTime: number | null = null;

  constructor(
    private readonly dispatch: AppDispatch,
    private readonly getState: () => RootState,
    private readonly getActiveChatConversationId: () => number | null,
  ) {}

  onDisconnect(): void {
    this.disconnectTime = Date.now();
  }

  async onReconnect(): Promise<void> {
    if (this.disconnectTime === null) return;

    const offlineDurationMs = Date.now() - this.disconnectTime;
    this.disconnectTime = null;

    // Jitter to spread reconnect storms across clients
    await sleep(Math.random() * MAX_JITTER_MS);

    const filters = selectFilters(this.getState());

    await this.dispatch(conversationActions.fetchConversations({
      page: 1,
      status: filters.status as Parameters<typeof conversationActions.fetchConversations>[0]['status'],
      assigneeType: filters.assignee_type as Parameters<typeof conversationActions.fetchConversations>[0]['assigneeType'],
      sortBy: filters.sort_by as Parameters<typeof conversationActions.fetchConversations>[0]['sortBy'],
      inboxId: parseInt(filters.inbox_id, 10),
    }));

    // Extended offline: catch up a second page
    if (offlineDurationMs > CATCH_UP_THRESHOLD_MS) {
      await this.dispatch(conversationActions.fetchConversations({
        page: 2,
        status: filters.status as Parameters<typeof conversationActions.fetchConversations>[0]['status'],
        assigneeType: filters.assignee_type as Parameters<typeof conversationActions.fetchConversations>[0]['assigneeType'],
        sortBy: filters.sort_by as Parameters<typeof conversationActions.fetchConversations>[0]['sortBy'],
        inboxId: parseInt(filters.inbox_id, 10),
      }));
    }

    // Re-fetch active conversation in ChatScreen
    const conversationId = this.getActiveChatConversationId();
    if (conversationId != null) {
      await this.dispatch(conversationActions.fetchConversation(conversationId));
    }
  }
}
```

### 5.8 AppState and background handling

With Option A from §4.5, the presence interval only runs while connected:

```typescript
// baseActionCableConnector.ts

private handleConnected = (): void => {
  this.connected = true;
  this.startPresenceInterval();
  this.reconnectService?.onReconnect().catch(err =>
    console.warn('[ActionCable] onReconnect failed:', err)
  );
};

private handleDisconnected = (): void => {
  this.connected = false;
  this.stopPresenceInterval();
  this.reconnectService?.onDisconnect();
};

private startPresenceInterval(): void {
  this.stopPresenceInterval();
  this.presenceInterval = setInterval(() => {
    try {
      this.cable.channel(channelName).perform('update_presence');
    } catch {
      // Channel may be closed; disconnect handler will fire shortly
    }
  }, PRESENCE_INTERVAL);
}

private stopPresenceInterval(): void {
  if (this.presenceInterval !== null) {
    clearInterval(this.presenceInterval);
    this.presenceInterval = null;
  }
}
```

No AppState awareness needed in the connector itself. The presence interval is driven by connection state, not by application foreground state.

---

## 6. Startup Scenarios

### Cold start (first install, no persisted state)

1. Redux store initializes with `initialState` — `installationUrl` is `EXPO_PUBLIC_INSTALLATION_URL` or empty string, `auth.user` is null.
2. `selectRealtimeConfig` returns `null` (no credentials).
3. `useRealtime` effect runs — `config` is null — no `init()` call.
4. User completes onboarding, enters credentials, logs in.
5. `auth.user` and `auth.user.pubsub_token` are populated.
6. `selectRealtimeConfig` returns a valid config.
7. `useRealtime` effect re-runs (config changed from null → valid).
8. `ActionCableService.init()` called. WebSocket connection established.

### Warm start (returning user, persisted state)

1. Redux-Persist begins rehydrating from AsyncStorage.
2. During rehydration, all selectors return `undefined`/null.
3. `selectRealtimeConfig` returns null — no spurious `init()` call.
4. Rehydration completes. `persist/REHYDRATE` dispatched.
5. `auth.user` is set from persisted state. `installationUrl` is set.
6. `selectWebSocketUrl` selector computes `wss://...` from `installationUrl` — always fresh, never stale.
7. `selectRealtimeConfig` returns valid config.
8. `useRealtime` effect fires. `ActionCableService.init()` called.

### JS reload (Expo dev, fast refresh)

1. Component tree unmounts — `useRealtime` cleanup runs — `ActionCableService.disconnect()` called.
2. Redux store is not persisted to disk between JS reloads (persist is in-progress or cleared).
3. On remount, `selectRealtimeConfig` returns null until the store rehydrates.
4. Same flow as warm start from step 4.

### Logout

1. User taps logout. `dispatch(logout())` fires.
2. `rootReducer` in `store/index.ts` intercepts `auth/logout` and resets entire state to `initialState` (preserving only `settings`).
3. `auth.user` becomes `null` → `selectPubSubToken` returns `undefined` → `selectRealtimeConfig` returns `null`.
4. `useRealtime` effect re-runs (config changed from valid → null).
5. The `if (!config)` branch calls `ActionCableService.disconnect()`, tearing down the WebSocket.
6. The component tree unmounts (logged-out user sees `AuthStack`), which triggers the `useEffect` cleanup — a second `disconnect()` call, which is harmless (no-op on null connector).

**Important**: The `rootReducer` state reset happens synchronously in the same dispatch cycle as the selector update, so there is no window where stale credentials could be used.

### Credentials change (account switch)

1. User switches account — `auth.user.account_id` changes.
2. `selectCurrentUserAccountId` emits new value.
3. `selectRealtimeConfig` emits new config object.
4. `useRealtime` effect re-runs.
5. `ActionCableService.init()` calls `disconnect()` on old connector, creates new one with new `accountId`.
6. Old `RoomChannel` subscription is torn down, new one with correct `account_id` is created.

### Foreground resume after background

1. App was in background for 45 seconds. WebSocket dropped by the server.
2. ActionCable library fires `disconnected` event. `handleDisconnected` sets `connected = false`, records `disconnectTime`, stops presence interval.
3. Library's internal reconnect loop fires but may not succeed if iOS suspended the socket.
4. User taps app. `AppState` → `active`.
5. `useRealtime` AppState handler fires: `config` valid + `!ActionCableService.isConnected`.
6. `ActionCableService.init()` — new connector, new WS connection.
7. `handleConnected` fires — starts presence interval, calls `onReconnect()`.
8. `onReconnect()`: 45s > 30s threshold → fetches page 1 + page 2 of conversations + active ChatScreen conversation.

### Server rejects connection (invalid token / expired session)

1. `ActionCableService.init()` creates a consumer and attempts to subscribe.
2. The Rails server rejects the subscription (e.g., pubsub_token expired or revoked).
3. The ActionCable library fires `disconnected` (possibly with a `willAttemptReconnect: false` flag, depending on the server response).
4. The library's internal retry loop may attempt reconnection, but it will keep failing.
5. **Gap in current and proposed design**: There is no mechanism to detect a permanent authentication failure (vs. a transient network error) and surface it to the user. The presence interval stops (per §4.5 Option A), and the reconnect service records a disconnect time, but the app silently runs without realtime updates.
6. **Future improvement**: Add an `onRejected` callback to detect subscription rejection and dispatch a Redux action (e.g., `realtimeConnectionFailed`) that can be consumed by a UI indicator. This is out of scope for the initial migration but should be tracked as a follow-up.

### Network offline from cold start

1. Redux-Persist rehydrates credentials. `selectRealtimeConfig` returns a valid config.
2. `useRealtime` calls `ActionCableService.init()`.
3. `ActionCable.createConsumer(webSocketUrl)` attempts to connect but fails immediately (no network).
4. The library fires `disconnected`. The reconnect service records a disconnect time.
5. When network becomes available, the user returns the app to foreground (or the library's internal retry succeeds).
6. `handleConnected` fires, presence starts, `onReconnect()` fetches catch-up data.
7. **Note**: There is currently no NetInfo listener in the realtime module. The library's internal retry + the AppState foreground handler cover most cases. Adding a NetInfo listener is a potential enhancement but adds complexity for marginal gain.

### `getChatwootVersion` updates `installationUrl` or `webSocketUrl` after connection

1. `settingsActions.getChatwootVersion` is dispatched in `AppTabs.tsx` `useEffect([], [installationUrl])`.
2. This thunk only writes to `state.settings.version` — it does **not** modify `installationUrl` or `webSocketUrl`.
3. Therefore, there is no race condition where `getChatwootVersion` changes the WS URL after ActionCable already connected.
4. With the proposed computed selector, `selectWebSocketUrl` derives from `installationUrl`, which only changes on `setInstallationUrl.fulfilled` or `REHYDRATE` — both of which happen before the first `ActionCableService.init()` call.

---

## 7. Testing Strategy

Per `docs/architecture/unit-testing.md`, the testing approach is: **test behavior, not implementation**. Use the real store where possible, mock at service boundaries.

### 7.1 `selectWebSocketUrl` selector

**Location**: `src/application/store/settings/__tests__/settingsSelectors.test.ts`

```typescript
import { createTestStore } from '@/__tests__/helpers';
import { selectWebSocketUrl } from '@application/store/settings/settingsSelectors';

describe('selectWebSocketUrl', () => {
  it('computes wss:// from https:// installation URL', () => {
    // createTestStore accepts Partial<RootState> with partial slice state
    const store = createTestStore({
      settings: { installationUrl: 'https://app.chatwoot.com/' } as any,
    });
    expect(selectWebSocketUrl(store.getState())).toBe('wss://app.chatwoot.com/cable');
  });

  it('computes ws:// from http:// installation URL', () => {
    const store = createTestStore({
      settings: { installationUrl: 'http://localhost:3000/' } as any,
    });
    expect(selectWebSocketUrl(store.getState())).toBe('ws://localhost:3000/cable');
  });

  it('strips trailing slash from installation URL', () => {
    const store = createTestStore({
      settings: { installationUrl: 'https://chat.example.com/' } as any,
    });
    expect(selectWebSocketUrl(store.getState())).toBe('wss://chat.example.com/cable');
  });

  it('returns empty string when installationUrl is empty', () => {
    const store = createTestStore({
      settings: { installationUrl: '' } as any,
    });
    expect(selectWebSocketUrl(store.getState())).toBe('');
  });
});
```

> **Note**: `createTestStore` from `src/__tests__/helpers/render.tsx` uses `configureStore` with `appReducer` and accepts partial preloaded state. The `as any` cast is needed because `Partial<SettingsState>` doesn't satisfy the full slice shape. In practice, the reducer fills missing fields from `initialState`.

### 7.2 `selectRealtimeConfig` selector

**Location**: `src/application/store/realtime/__tests__/realtimeSelectors.test.ts`

```typescript
describe('selectRealtimeConfig', () => {
  it('returns null when pubSubToken is missing', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: null } },
      settings: { installationUrl: 'https://app.chatwoot.com/' },
    });
    expect(selectRealtimeConfig(store.getState())).toBeNull();
  });

  it('returns full config when all credentials present', () => {
    const store = createTestStore({
      auth: { user: { id: 42, account_id: 7, pubsub_token: 'token-xyz' } },
      settings: { installationUrl: 'https://app.chatwoot.com/' },
    });
    expect(selectRealtimeConfig(store.getState())).toEqual({
      pubSubToken: 'token-xyz',
      webSocketUrl: 'wss://app.chatwoot.com/cable',
      accountId: 7,
      userId: 42,
    });
  });
});
```

### 7.3 `ActionCableReconnectService`

**Location**: `src/application/store/realtime/__tests__/realtimeReconnectService.test.ts`

Mock `dispatch` and `getState`. No store needed.

```typescript
import { ActionCableReconnectService } from '../realtimeReconnectService';

describe('ActionCableReconnectService', () => {
  const mockDispatch = jest.fn().mockResolvedValue(undefined);
  const mockGetState = jest.fn().mockReturnValue({
    conversationFilter: {
      filters: { status: 'open', assignee_type: 'all', sort_by: 'latest', inbox_id: '0' },
    },
  });
  const mockGetActiveConversationId = jest.fn().mockReturnValue(null);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Mock Math.random for deterministic jitter
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not fetch if no disconnect was recorded', async () => {
    const service = new ActionCableReconnectService(mockDispatch, mockGetState, mockGetActiveConversationId);
    await service.onReconnect();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('fetches page 1 after short disconnect', async () => {
    const service = new ActionCableReconnectService(mockDispatch, mockGetState, mockGetActiveConversationId);
    service.onDisconnect();
    // onReconnect uses Date.now() internally to compute duration.
    // With fake timers, advance time to simulate 5 seconds offline.
    jest.advanceTimersByTime(5_000);
    const reconnectPromise = service.onReconnect();
    // Flush the jitter setTimeout (0ms because Math.random mocked to 0)
    jest.runAllTimers();
    await reconnectPromise;
    // page 1 only (under 30s threshold)
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('fetches page 1 and page 2 after long disconnect', async () => {
    const service = new ActionCableReconnectService(mockDispatch, mockGetState, mockGetActiveConversationId);
    service.onDisconnect();
    jest.advanceTimersByTime(60_000);
    const reconnectPromise = service.onReconnect();
    jest.runAllTimers();
    await reconnectPromise;
    // page 1 + page 2 = 2 fetchConversations dispatches
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('also fetches active ChatScreen conversation on reconnect', async () => {
    mockGetActiveConversationId.mockReturnValue(99);
    const service = new ActionCableReconnectService(mockDispatch, mockGetState, mockGetActiveConversationId);
    service.onDisconnect();
    const reconnectPromise = service.onReconnect();
    jest.runAllTimers();
    await reconnectPromise;
    // fetchConversations (page 1) + fetchConversation (id 99) = 2 dispatches
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('cannot reconnect twice (disconnectTime cleared after first reconnect)', async () => {
    const service = new ActionCableReconnectService(mockDispatch, mockGetState, mockGetActiveConversationId);
    service.onDisconnect();
    const p1 = service.onReconnect();
    jest.runAllTimers();
    await p1;
    const p2 = service.onReconnect(); // should be no-op
    jest.runAllTimers();
    await p2;
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
```

> **Note**: The `mockGetState` must return `{ conversationFilter: { filters: {...} } }` to match the real `selectFilters` selector shape (it reads `state.conversationFilter.filters`). The original example was missing the nested `filters` key. `jest.useFakeTimers()` is required because `onReconnect()` uses `setTimeout` for jitter.

### 7.4 `BaseActionCableConnector` — connect/disconnect/presence

**Location**: `src/infrastructure/utils/__tests__/baseActionCableConnector.test.ts`

Mock `@kesha-antonov/react-native-action-cable`. Test that:

- `handleConnected` sets `this.connected = true` and starts interval
- `handleDisconnected` sets `this.connected = false` and clears interval
- `disconnect()` stops the interval and calls `consumer.disconnect()`
- `onReceived` routes to the correct event handler
- `isAValidEvent` rejects events with wrong `account_id`

```typescript
jest.mock('@kesha-antonov/react-native-action-cable', () => ({
  ActionCable: {
    createConsumer: jest.fn(() => ({
      subscriptions: {
        create: jest.fn(() => ({
          perform: jest.fn(),
        })),
      },
      disconnect: jest.fn(),
    })),
  },
  Cable: jest.fn().mockImplementation(() => ({
    setChannel: jest.fn().mockReturnValue({
      on: jest.fn(),
    }),
    channel: jest.fn().mockReturnValue({
      perform: jest.fn(),
    }),
  })),
}));
```

### 7.5 `ActionCableConnector` — event handler dispatch

**Location**: `src/infrastructure/utils/__tests__/actionCableConnector.test.ts`

Inject a mock `dispatch` function. Fire each event type. Assert the correct Redux action was dispatched with the correct payload.

```typescript
// NOTE: These tests assume the PROPOSED constructor signature after Step 3 refactor.
// The current constructor is: (pubSubToken, webSocketUrl, accountId, userId) with no dispatch injection.
describe('ActionCableConnector event dispatch', () => {
  let connector: ActionCableConnector;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    connector = new ActionCableConnector(
      { pubSubToken: 'tok', webSocketUrl: 'wss://x.com/cable', accountId: 1, userId: 2 },
      mockDispatch,
      new Set(),
    );
  });

  it('dispatches addOrUpdateMessage on message.created', () => {
    connector.onMessageCreated(rawMessageFixture);
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'conversation/addOrUpdateMessage',
    }));
  });

  it('fetches missing conversation on message.created when not in store', () => {
    // Connector reads store state to check if conversation exists
    // With injected dispatch, verify fetchConversation was dispatched
    connector.onMessageCreated({ ...rawMessageFixture, conversation_id: 999 });
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: expect.stringContaining('conversations/fetchConversation'),
    }));
  });

  it('does not duplicate-fetch an in-flight conversation', () => {
    connector.onMessageCreated({ ...rawMessageFixture, conversation_id: 999 });
    connector.onMessageCreated({ ...rawMessageFixture, conversation_id: 999 });
    // Should dispatch fetchConversation only once
    const fetchCalls = mockDispatch.mock.calls.filter(([action]) =>
      action?.type?.includes('fetchConversation')
    );
    expect(fetchCalls).toHaveLength(1);
  });

  it('dispatches removeContact on contact.deleted', () => {
    connector.onContactDelete({ id: 42 });
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'contact/removeContact',
      payload: 42,
    }));
  });
});
```

### 7.6 `useRealtime` hook

**Location**: `src/application/store/realtime/__tests__/useRealtime.test.ts`

Mock `ActionCableService`. Test that:

- `init()` is called when config becomes non-null
- `disconnect()` is called on cleanup
- `disconnect()` is called when config becomes null (logout)
- `init()` is called on AppState → active if `!isConnected`
- `init()` is NOT called on AppState → active if already `isConnected`

```typescript
jest.mock('@application/store/realtime/realtimeService', () => ({
  ActionCableService: {
    init: jest.fn(),
    disconnect: jest.fn(),
    isConnected: false,
  },
}));

describe('useRealtime', () => {
  it('calls init when valid config is present', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: 'abc' } },
      settings: { installationUrl: 'https://app.chatwoot.com/' },
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });

    expect(ActionCableService.init).toHaveBeenCalledWith(
      expect.objectContaining({ pubSubToken: 'abc' }),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('calls disconnect on unmount', () => {
    const store = createTestStore({ /* valid creds */ });
    const { unmount } = renderHook(() => useRealtime(), { wrapper: createWrapper(store) });
    unmount();
    expect(ActionCableService.disconnect).toHaveBeenCalled();
  });

  it('does not call init when config is null (no credentials)', () => {
    const store = createTestStore({
      auth: { user: null },
    });
    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });
    expect(ActionCableService.init).not.toHaveBeenCalled();
  });
});
```

### 7.7 Test coverage summary

| Unit | Tests | Priority |
|------|-------|----------|
| `selectWebSocketUrl` selector | 4 cases (https/http/trailing-slash/empty) | High |
| `selectRealtimeConfig` selector | null when missing, valid when complete | High |
| `ActionCableReconnectService` | no-op before disconnect, short/long offline, active chat, idempotent | High |
| `BaseActionCableConnector` | connect/disconnect/presence lifecycle | Medium |
| `ActionCableConnector` | each event type dispatches correctly, dedup guard | Medium |
| `useRealtime` | init on creds, disconnect on cleanup, AppState handlers | Medium |
| `settingsSlice` (REHYDRATE removed) | regression: webSocketUrl not in state | Low |

---

## 8. Migration Path

The changes are safe to make incrementally. Each step is independently deployable.

### Step 1: Remove `webSocketUrl` from persisted state (low risk)

1. Delete `webSocketUrl` from `SettingsState` interface and `initialState`.
2. Replace `selectWebSocketUrl` with computed selector in `settingsSelectors.ts`.
3. Remove `state.webSocketUrl = ...` from `setInstallationUrl.fulfilled`.
4. Remove `InstallationUrls.webSocketUrl` from `settingsTypes.ts`.
5. Remove the `webSocketUrl` re-derivation from the `addMatcher(persist/REHYDRATE)` block in `settingsSlice.ts`. Keep the `console.warn` debug logging if desired, or remove the entire block if the logging is not needed.
6. Keep the `REHYDRATE` env-mismatch block in `store/index.ts` — it corrects `installationUrl`/`baseUrl` and is still needed.
7. Run `pnpm test` — verify `selectWebSocketUrl` tests pass.
8. Test on device: connect, kill app, reopen — WebSocket URL should still be correct.

### Step 2: Create `application/store/realtime/` module

1. Create `realtimeTypes.ts` with `RealtimeConfig` type.
2. Create `realtimeSelectors.ts` with `selectRealtimeConfig`.
3. Move `MobileReconnectService` → `realtimeReconnectService.ts` (with injected `dispatch`/`getState`/callback).
4. Create `realtimeService.ts` with `ActionCableService` static class.
5. Create barrel `index.ts`.
6. Write tests (§7.3, §7.2).

### Step 3: Refactor `ActionCableConnector` to accept injected dispatch

1. Add `dispatch: AppDispatch`, `getState: () => RootState`, and `fetchingConversations: Set<number>` constructor parameters.
2. Replace all `store.dispatch(...)` calls with `this.dispatch(...)`.
3. Replace `store.getState()` calls (in `onMessageCreated` and `onFirstReplyCreated` for the "is conversation loaded?" check) with `this.getState()`.
4. Remove `import { store }` from `actionCable.ts`.
5. Write event dispatch tests (§7.5).

### Step 4: Extract `useRealtime` hook

1. Create `src/application/store/realtime/useRealtime.ts`.
2. Move ActionCable lifecycle logic from `AppTabs.tsx` into `useRealtime`.
3. Call `useRealtime()` from a `<RealtimeGate />` component rendered just inside the auth gate in `app.tsx`.
4. Remove all ActionCable imports and logic from `AppTabs.tsx`.
5. Write `useRealtime` tests (§7.6).

### Step 5: Add `<RealtimeGate />` in `app.tsx`

```tsx
// src/app.tsx (schematic — location depends on actual app.tsx structure)

const RealtimeGate = () => {
  useRealtime(); // entire lifecycle in one hook call
  return null;
};

// Inside auth gate, after store Provider:
const isLoggedIn = useAppSelector(selectLoggedIn);
return isLoggedIn ? <RealtimeGate /> : null;
```

Alternatively, call `useRealtime()` directly in a new root-level component `<AuthenticatedApp />` that wraps the logged-in screen tree.

### Step 6: Cleanup

1. Delete `reconnectService.ts` (replaced by `realtimeReconnectService.ts`).
2. Verify `pnpm lint` passes (ESLint import rules).
3. Verify `npx tsc --noEmit` passes (0 errors).
4. Verify `pnpm test` passes (all tests green).
5. Test end-to-end on device: cold start, warm start, foreground/background, account switch.

---

## Summary: Hacked vs. Proposed

| Concern | Current (hacked) | Proposed |
|---------|-----------------|----------|
| Lifecycle owner | `AppTabs.tsx` (navigation component) | `useRealtime()` hook in `application/store/realtime/` + `<RealtimeGate />` in `app.tsx` |
| `webSocketUrl` derivation | Persisted in Redux, re-derived twice on REHYDRATE | Computed selector from `installationUrl`; never stored |
| Stale credentials on startup | `useCallback` deps ensure re-run after rehydrate | `selectRealtimeConfig` returns null until credentials ready |
| Module singleton | `let activeConnector: ActionCableConnector \| null = null` at module scope | `static connector` on `ActionCableService` class, reset via `init()` |
| `fetchingConversations` Set | Module scope, cleared in `init()` | Instance member on `ActionCableConnector`, fresh Set per `init()` |
| `store` import in infrastructure | `import { store }` directly | Injected `dispatch` + `getState` via constructor |
| AppState handling | Inline in `AppTabs.tsx` useEffect with `cableConfigRef` workaround | `useRealtime()` with stable `configRef` |
| Presence interval | Started in constructor, runs always | Started on `connected`, stopped on `disconnected` |
| Reconnect catch-up | Single page-1 fetch, no offline duration awareness | Jittered, offline-duration-aware, two-page catch-up when > 30s |
| `MobileReconnectService` placement | `infrastructure/utils/` | `application/store/realtime/` |
| Navigation coupling in reconnect | Imports `navigationRef` directly | Callback injected at construction, testable in isolation |
| Tests | None for ActionCable lifecycle | Full suite: selector, reconnect service, connector, hook |

---

## Review Notes

> **Reviewer**: Architecture review, March 2026  
> **Documents cross-referenced**: `clean-architecture.md`, `ai-chat-architecture.md`, `AGENTS.md`, plus all implementation files listed in §1.

### Changes made

#### Factual corrections

1. **§1 System Overview**: Added clarification that events arrive in snake_case from Rails and are transformed via `camelCaseKeys.ts` (`camelcase-keys` deep). The original text omitted this transform layer.

2. **§1 File map**: Added missing entries for `settingsSelectors.ts` (where `selectWebSocketUrl` lives), `settingsTypes.ts` (where `InstallationUrls` is defined), and `camelCaseKeys.ts`. These are directly relevant to the ActionCable system.

3. **§2 Bug 2 fix description**: Corrected the description of what `store/index.ts` does on REHYDRATE. The original said it "re-derives `webSocketUrl`" — in reality it only overrides `installationUrl` and `baseUrl` when env vars differ. The WS URL re-derivation happens downstream in `settingsSlice`'s `addMatcher`.

4. **§4.1**: Corrected the ESLint violation claim. The `navigation/` → `store/` import rule is documented in `clean-architecture.md` §8.2 but is **not currently enforced** by the ESLint config in `eslint.config.mjs`. Clarified this is an architectural violation, not a lint-enforced one.

5. **§4.2**: Corrected description of `selectWebSocketUrl` — it currently reads from stored state (`settings.webSocketUrl`), not computing anything. Added the actual current selector code.

6. **§4.2 / §5.6 / Migration Step 1**: The proposal originally said to remove the REHYDRATE env-mismatch block from `store/index.ts`. Corrected: that block does NOT touch `webSocketUrl` — it corrects `installationUrl` and `baseUrl`. It must be **kept** as it's still necessary for environment switching.

7. **§4.6**: Fixed description of `disconnectTime` — it IS used as a guard (onReconnect no-ops if null), but the duration is never computed. The original text was imprecise ("recorded but never used").

8. **§2 Bug 6–8**: Added a note about the snake_case → camelCase transform layer, documenting that `onPresenceUpdate` is the only handler that skips the transform (correctly, since its payload uses simple key-value maps).

#### Missing edge cases added (§6)

9. **Logout scenario**: Added complete flow showing how `auth/logout` → rootReducer state reset → `selectRealtimeConfig` returns null → `useRealtime` disconnects. This was entirely missing.

10. **Server rejects connection**: Added scenario for invalid/expired pubsub_token. Documented the gap: there is no mechanism to detect permanent auth failure vs. transient network error. Marked as future improvement.

11. **Network offline from cold start**: Added scenario. Documented that the library's internal retry + AppState foreground handler cover this case without a dedicated NetInfo listener.

12. **`getChatwootVersion` race condition**: Added clarification that this thunk only writes `state.settings.version` and does NOT modify `installationUrl` or `webSocketUrl`, so there is no race condition with ActionCable.

#### Architecture consistency fixes

13. **`useRealtime` hook placement**: Moved from `infrastructure/hooks/` to `application/store/realtime/`. The original placement violated the dependency rule — `infrastructure/` should not import feature-specific selectors from `application/store/<feature>/`. The corrected placement follows the pattern of co-locating feature hooks with their store module.

14. **Feature isolation concern**: Added note about `realtimeReconnectService.ts` importing from `conversation/` (cross-feature import per §8.3 of `clean-architecture.md`). Documented as an acceptable pragmatic exception with a path to resolution.

#### Testing improvements

15. **§7.1 selector tests**: Updated to use `createTestStore` from `src/__tests__/helpers/render.tsx` with proper import paths. Added note about the `as any` cast needed for partial state.

16. **§7.3 reconnect service tests**: Fixed `mockGetState` to return the correct shape (`{ conversationFilter: { filters: {...} } }` instead of `{ conversationFilter: { status: ... } }`). Added `jest.useFakeTimers()` / `jest.useRealTimers()` setup. Mocked `Math.random` for deterministic jitter. Added `jest.runAllTimers()` calls to flush the jitter `setTimeout`.

17. **§7.5 connector tests**: Added note clarifying these tests assume the PROPOSED constructor signature (after Step 3 refactor), not the current one.

#### Not changed (intentional)

- **Migration plan**: The 6-step plan is pragmatic and appropriate for a small team. Each step is independently deployable. No simplification needed.
- **State machine diagram (§5.2)**: Accurate and useful. No changes.
- **`ActionCableService` static class pattern (§5.4)**: Reasonable for a singleton. A future improvement could use a proper DI-managed instance, but that would be over-engineering for current scale.
- **Presence interval strategy (§4.5 Option A)**: Correct recommendation. No changes needed.
