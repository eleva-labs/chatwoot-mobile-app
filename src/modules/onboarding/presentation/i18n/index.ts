/**
 * Onboarding Module i18n
 *
 * Self-contained internationalization for the onboarding module.
 * This allows the module to be used as a standalone library.
 */

import i18n from '@infrastructure/i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

// Store the onboarding translations separately
const onboardingTranslations: Record<string, Record<string, string>> = {
  en,
  es,
  pt,
};

// Type for onboarding locales
type OnboardingLocales = 'en' | 'es' | 'pt';

// Merge onboarding translations into the existing i18n instance
// using i18n-js v4 store() API — only if not already merged
const existingTranslations = i18n.translations ?? {};
const existingEn = existingTranslations.en as Record<string, unknown> | undefined;
if (!existingEn?.onboarding) {
  const translationsToStore: Record<string, { onboarding: Record<string, string> }> = {};
  (Object.keys(onboardingTranslations) as OnboardingLocales[]).forEach(locale => {
    translationsToStore[locale] = { onboarding: onboardingTranslations[locale] };
  });
  if (typeof i18n.store === 'function') {
    i18n.store(translationsToStore);
  }
}

// Export the i18n instance
export const onboardingI18n = i18n;

/**
 * Translation helper for the onboarding module
 * @param key - Translation key (e.g., 'loading', 'next')
 * @param locale - Locale to use (defaults to current locale)
 * @param options - Interpolation options
 */
export function t(key: string, locale?: string, options?: Record<string, unknown>): string {
  const previousLocale = onboardingI18n.locale;

  if (locale) {
    onboardingI18n.locale = locale;
  }

  // Prefix the key with 'onboarding.' to access the namespaced translations
  const translation = onboardingI18n.t(`onboarding.${key}`, options);

  // Restore previous locale
  if (locale) {
    onboardingI18n.locale = previousLocale;
  }

  return translation;
}

/**
 * Set the locale for the onboarding module
 */
export function setLocale(locale: string) {
  onboardingI18n.locale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): string {
  return onboardingI18n.locale || onboardingI18n.defaultLocale;
}

/**
 * Add custom translations to the onboarding module
 * Useful for extending the module with additional languages
 */
export function addTranslations(locale: string, newTranslations: Record<string, string>) {
  // In v4, use store() to merge new translations
  const allTranslations = i18n.translations ?? {};
  const existing = (allTranslations[locale] as Record<string, unknown> | undefined) ?? {};
  const existingOnboarding = (existing.onboarding ?? {}) as Record<string, string>;
  if (typeof i18n.store === 'function') {
    i18n.store({
      [locale]: {
        onboarding: {
          ...existingOnboarding,
          ...newTranslations,
        },
      },
    });
  }
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): boolean {
  const allTranslations = i18n.translations ?? {};
  const translation = allTranslations[locale] as Record<string, unknown> | undefined;
  return !!translation && 'onboarding' in translation;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): string[] {
  const allTranslations = i18n.translations ?? {};
  return Object.keys(allTranslations).filter(locale => {
    const translation = allTranslations[locale] as Record<string, unknown> | undefined;
    return translation && 'onboarding' in translation;
  });
}

// Export translation keys for type safety
export const TranslationKeys = {
  LOADING: 'loading',
  LOADING_ERROR: 'loadingError',
  NEXT: 'next',
  PREVIOUS: 'previous',
  SKIP: 'skip',
  SUBMIT: 'submit',
  RETRY: 'retry',
  ERROR_TITLE: 'errorTitle',
  GENERIC_ERROR: 'genericError',
  OFFLINE_INDICATOR: 'offlineIndicator',
  REQUIRED_FIELD: 'requiredField',
  INVALID_INPUT: 'invalidInput',
  PROGRESS_LABEL: 'progressLabel',
} as const;

export type TranslationKey = (typeof TranslationKeys)[keyof typeof TranslationKeys];
