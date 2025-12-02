/**
 * Onboarding Module - Public API
 *
 * This is the main entry point for the onboarding module.
 * Simple, clean API that hides all internal complexity.
 */

// Main Component (Primary API)
export { OnboardingModule } from './presentation/components/OnboardingModule';
export type { OnboardingModuleProps } from './presentation/components/OnboardingModule';

// Translations (i18n) - Self-contained within the module
export {
  t as translateOnboarding,
  setLocale as setOnboardingLocale,
  getLocale as getOnboardingLocale,
  addTranslations as addOnboardingTranslations,
  isLocaleSupported as isOnboardingLocaleSupported,
  getAvailableLocales as getOnboardingAvailableLocales,
  TranslationKeys,
} from './presentation/i18n';
export type { TranslationKey } from './presentation/i18n';

// Theme
export {
  OnboardingThemeProvider,
  useOnboardingTheme,
} from './presentation/theme/OnboardingThemeContext';
export type {
  OnboardingTheme,
  OnboardingThemeColors,
  OnboardingThemeFonts,
  OnboardingThemeSpacing,
} from './presentation/theme/OnboardingTheme';
export { defaultOnboardingTheme, darkOnboardingTheme } from './presentation/theme/OnboardingTheme';

// Events
export type {
  OnboardingEventCallbacks,
  OnFlowStartedEvent,
  OnQuestionAnsweredEvent,
  OnQuestionSkippedEvent,
  OnScreenChangedEvent,
  OnFlowCompletedEvent,
  OnFlowSkippedEvent,
  OnErrorEvent,
} from './presentation/events/OnboardingEvents';

// Factory (For advanced customization only)
export {
  createOnboardingDependencies,
  getDefaultOnboardingDependencies,
  resetDefaultOnboardingDependencies,
} from './presentation/factory/OnboardingFactory';
export type {
  OnboardingDependencies,
  OnboardingFactoryOptions,
} from './presentation/factory/OnboardingFactory';

// Advanced Hooks (For custom UI implementations)
export { useOnboarding } from './presentation/hooks/useOnboarding';
export type { UseOnboardingOptions, UseOnboardingReturn } from './presentation/hooks/useOnboarding';
export { useValidation } from './presentation/hooks/useValidation';
export type { UseValidationReturn } from './presentation/hooks/useValidation';
export { useNetworkState } from './presentation/hooks/useNetworkState';

// Types (For TypeScript support)
export type {
  QuestionType,
  ConditionalOperator,
  ValidationRule,
  ConditionalLogic,
  UIConfig,
  SkipConfig,
  SelectOption,
  AnswerValue,
  Answers,
} from './domain/common';
export { Result } from './domain/entities/Result';
export type {
  DomainError,
  ValidationError,
  NetworkError,
  NotFoundError,
  StorageError,
} from './domain/entities/Errors';
