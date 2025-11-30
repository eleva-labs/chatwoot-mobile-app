/**
 * Onboarding Module i18n
 *
 * Self-contained internationalization for the onboarding module.
 * This allows the module to be used as a standalone library.
 */

import I18n from 'i18n-js';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

// Store the onboarding translations separately
const onboardingTranslations = {
  en,
  es,
  pt,
};

// Merge onboarding translations into the existing i18n instance
// This ensures we don't overwrite the app's translations
if (!I18n.translations.en?.onboarding) {
  Object.keys(onboardingTranslations).forEach(locale => {
    if (!I18n.translations[locale]) {
      I18n.translations[locale] = {};
    }
    I18n.translations[locale].onboarding = onboardingTranslations[locale];
  });
}

// Export the i18n instance
export const onboardingI18n = I18n;

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
export function addTranslations(locale: string, translations: Record<string, string>) {
  if (!onboardingI18n.translations[locale]) {
    onboardingI18n.translations[locale] = {};
  }

  if (!onboardingI18n.translations[locale].onboarding) {
    onboardingI18n.translations[locale].onboarding = {};
  }

  onboardingI18n.translations[locale].onboarding = {
    ...onboardingI18n.translations[locale].onboarding,
    ...translations,
  };
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): boolean {
  return (
    locale in onboardingI18n.translations &&
    'onboarding' in (onboardingI18n.translations[locale] || {})
  );
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): string[] {
  return Object.keys(onboardingI18n.translations).filter(locale => {
    const translation = onboardingI18n.translations[locale] as Record<string, unknown> | undefined;
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
