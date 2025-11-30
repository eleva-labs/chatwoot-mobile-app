# Onboarding Module

A self-contained, server-driven onboarding kit for Expo/React Native. `OnboardingModule` is the primary export: it assembles repositories, validation, offline queueing, theming, and events internally so consumers only provide configuration and callbacks.

## Server JSON Contract

```json
{
  "onboarding_flow": {
    "id": "enterprise-welcome-v2",
    "version": "2.1.0",
    "locale": "en",
    "title": "Welcome to Enterprise",
    "skip_config": {
      "allow_skip_entire_flow": true,
      "skip_entire_flow_button": "Skip onboarding",
      "skip_confirmation": {
        "title": "Skip onboarding?",
        "message": "You can continue later from settings",
        "confirm_text": "Skip",
        "cancel_text": "Keep going"
      },
      "track_skip_reasons": true
    },
    "screens": [
      {
        "id": "name",
        "type": "text",
        "title": "Your full name",
        "description": "We use this to personalize replies",
        "placeholder": "e.g. Jamie Doe",
        "validation": {
          "required": true,
          "min_length": 3,
          "error_message": "Please enter your name"
        },
        "ui_config": {
          "layout": "list",
          "show_value": true
        }
      },
      {
        "id": "role",
        "type": "single_select",
        "title": "Your role",
        "options": [
          { "id": "support", "label": "Support", "value": "support" },
          { "id": "sales", "label": "Sales", "value": "sales" },
          {
            "id": "ops",
            "label": "Operations",
            "value": "ops",
            "allow_custom_input": true,
            "custom_input_placeholder": "Describe your team"
          }
        ],
        "validation": {
          "required": true,
          "skip_button_text": "Skip role"
        },
        "conditional_logic": {
          "question_id": "name",
          "operator": "is_not_empty",
          "value": ""
        }
      },
      {
        "id": "interests",
        "type": "multi_select",
        "title": "Select interest areas",
        "options": [
          { "id": "product", "label": "Product", "value": "product" },
          { "id": "docs", "label": "Documentation", "value": "docs" },
          { "id": "integrations", "label": "Integrations", "value": "integrations" }
        ],
        "validation": {
          "max_selection": 2,
          "error_message": "Choose up to two areas"
        }
      },
      {
        "id": "availability",
        "type": "date",
        "title": "Preferred kickoff date",
        "ui_config": {
          "mode": "datetime",
          "min_date": "2025-01-01",
          "max_date": "2025-12-31"
        }
      },
      {
        "id": "confidence",
        "type": "rating",
        "title": "Your confidence level",
        "ui_config": {
          "style": "stars",
          "max_rating": 5,
          "allow_half": true
        },
        "default_value": 4
      },
      {
        "id": "budget",
        "type": "slider",
        "title": "Target monthly spend ($)",
        "ui_config": {
          "min": 500,
          "max": 5000,
          "step": 250,
          "show_value": true,
          "unit": "USD"
        }
      },
      {
        "id": "identity",
        "type": "file_upload",
        "title": "Upload ID (optional)",
        "ui_config": {
          "accept": ["image/jpeg", "application/pdf"],
          "max_size_mb": 5,
          "show_camera_option": true
        },
        "validation": {
          "required": false
        }
      }
    ]
  }
}
```

- The JSON mirrors `OnboardingFlowDTO` → `OnboardingFlow`. Fields such as `screens`, `skip_config`, `validation`, `ui_config`, and `conditional_logic` must match the Zod schema.
- Every screen type above (`text`, `single_select`, `multi_select`, `date`, `rating`, `slider`, `file_upload`) is supported out of the box.
- Optional fields like `default_value`, `placeholder`, and `options` allow rich UI control and conditional branching.

## Usage Variants (All Possibilities)

### 1. `OnboardingModule` (Recommended)

```tsx
import { OnboardingModule } from '@/modules/onboarding';

<OnboardingModule
  locale="en"
  autoLoad
  onEvent={{
    onFlowStarted: event => analytics.track('started', event),
    onFlowCompleted: event => navigate('Dashboard'),
    onError: err => showToast(err.message),
  }}
  onComplete={() => navigate('Dashboard')}
/>;
```

- Ideal for most apps: locale, events, completion/skip callbacks, and built-in offline handling are provided automatically.
- The module also accepts `initialAnswers`, `disableAutoSubmit`, and theming overrides via both props and `OnboardingThemeProvider`.

### 2. Factory & Dependency Overrides

```tsx
import { OnboardingModule } from '@/modules/onboarding';

<OnboardingModule
  factoryOptions={{
    enableOfflineQueue: false, // opt out if AsyncStorage is unavailable
    storageRepository: new CustomStorage(),
    onboardingRepository: new CustomOnboardingApi(),
  }}
  onComplete={handleCompletion}
/>;
```

- Replace repositories (API client, storage) when you need custom networking or persistence behavior.
- Toggle `enableOfflineQueue` to disable the queue (or pass a custom queue implementation via `createOnboardingDependencies`).
- Use `getDefaultOnboardingDependencies()` to share the same instances across screens and `resetDefaultOnboardingDependencies()` between tests.

### 3. Hooks & Custom UI

```tsx
import { useMemo, useEffect } from 'react';
import {
  createOnboardingDependencies,
  useOnboarding,
  useValidation,
  useNetworkState,
} from '@/modules/onboarding';

const deps = useMemo(() => createOnboardingDependencies(), []);
const onboarding = useOnboarding(
  deps.fetchFlowUseCase,
  deps.submitAnswersUseCase,
  deps.saveProgressUseCase,
  { locale: 'en' },
);
const validation = useValidation(deps.validateAnswerUseCase);
const networkState = useNetworkState();

useEffect(() => {
  if (networkState.isConnected && deps.processOfflineQueueUseCase) {
    deps.processOfflineQueueUseCase.execute();
  }
}, [networkState.isConnected]);
```

- Drop down to hooks when you need a custom renderer (e.g., deck-style cards or inline questions) while still benefiting from validation, saving, and queueing.
- `useOnboarding` exposes `flow`, `currentScreen`, `answers`, `progress`, `loading`, `error`, `setAnswer`, `goToNext`, `submitAnswers`, etc.
- Combine with `useValidation` for per-question checks and `deps.offlineQueue` for inspecting queued entries.

### 4. Theming & Events

```tsx
import { OnboardingModule, OnboardingThemeProvider } from '@/modules/onboarding';

const theme = {
  colors: { primary: '#6366F1', background: '#0F172A', text: '#E0E7FF' },
  spacing: { large: 20 },
};

<OnboardingThemeProvider theme={theme}>
  <OnboardingModule
    locale="en"
    onEvent={{
      onQuestionAnswered: event => analytics.track('answered', event),
    }}
  />
</OnboardingThemeProvider>;
```

- Themes are merged with defaults (light/dark) so you can override colors, fonts, spacing, shadows, borders, and more.
- Events cover `onFlowStarted`, `onScreenChanged`, `onQuestionAnswered`, `onQuestionSkipped`, `onFlowCompleted`, `onFlowSkipped`, and `onError`.

### 5. Offline Resilience / Network Notes

- Submissions that fail with `NetworkError` are queued in `AsyncStorage` and retried automatically when connectivity returns. The queue retries each item up to 3 times before discarding it.
- Provide `factoryOptions.enableOfflineQueue = false` to disable queueing or supply a custom `OfflineQueue` implementation through `createOnboardingDependencies`.
- The same offline queue can be monitored manually via `deps.offlineQueue.getQueue()` when building custom dashboards or retries.
- Every use case returns `Result<T, Error>` so you can `result.match(success, failure)` to surface errors explicitly.

## TypeScript Helpers & Errors

- Exported types: `QuestionType`, `ValidationRule`, `ConditionalLogic`, `UIConfig`, `ScreenDTO`, `Answers`, `AnswerValue`, and more for inflight typing.
- Error classes: `DomainError`, `ValidationError`, `NetworkError`, `NotFoundError`, `StorageError` (used throughout the module and surfaced via the `Result` pattern).

## Testing & Docs

- Use `createOnboardingDependencies()` with `InMemoryStorageRepository` or mocked `IOnboardingRepository` for unit testing.
- Call `resetDefaultOnboardingDependencies()` between tests to avoid shared state.
- For full architectural guidance consult:
- `/on_boarding_process.md`
- `/docs/ignored/onboarding_document_analysis.md`
