/**
 * Locale Utilities
 *
 * General utilities for working with device locales and language codes.
 * These utilities are app-wide and not specific to any module.
 */

import { getLocales } from 'expo-localization';

/**
 * Supported onboarding flow locales
 */
export const SUPPORTED_ONBOARDING_LOCALES = ['en', 'es', 'pt'] as const;

export type SupportedOnboardingLocale = (typeof SUPPORTED_ONBOARDING_LOCALES)[number];

/**
 * Get the device's primary language code (e.g., 'en', 'es', 'pt')
 *
 * @returns The device's primary language code, or 'en' as fallback
 *
 * @example
 * ```typescript
 * const deviceLang = getDeviceLanguageCode(); // 'es' for Spanish device
 * ```
 */
export function getDeviceLanguageCode(): string {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0 && locales[0].languageCode) {
      return locales[0].languageCode;
    }
  } catch (error) {
    console.warn('[localeUtils] Failed to get device locale:', error);
  }
  return 'en';
}

/**
 * Get the device's primary locale tag (e.g., 'en-US', 'es-ES', 'pt-BR')
 *
 * @returns The device's primary locale tag, or 'en' as fallback
 *
 * @example
 * ```typescript
 * const deviceLocale = getDeviceLocaleTag(); // 'es-ES' for Spanish (Spain) device
 * ```
 */
export function getDeviceLocaleTag(): string {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      return locales[0].languageTag;
    }
  } catch (error) {
    console.warn('[localeUtils] Failed to get device locale tag:', error);
  }
  return 'en';
}

/**
 * Get all device locales in order of preference
 *
 * @returns Array of language codes in order of user preference
 *
 * @example
 * ```typescript
 * const locales = getDeviceLanguageCodes(); // ['es', 'en'] for Spanish device with English as secondary
 * ```
 */
export function getDeviceLanguageCodes(): string[] {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      return locales
        .map(locale => locale.languageCode)
        .filter((code): code is string => code !== null && code !== undefined);
    }
  } catch (error) {
    console.warn('[localeUtils] Failed to get device locales:', error);
  }
  return ['en'];
}

/**
 * Map device language code to a supported onboarding locale
 *
 * Maps device language codes to onboarding-supported locales:
 * - 'es' → 'es' (Spanish)
 * - 'pt' → 'pt' (Portuguese)
 * - All others → 'en' (English, default)
 *
 * @param deviceLanguageCode - The device's language code (e.g., 'es', 'pt', 'fr')
 * @returns A supported onboarding locale code
 *
 * @example
 * ```typescript
 * mapToOnboardingLocale('es'); // 'es'
 * mapToOnboardingLocale('pt'); // 'pt'
 * mapToOnboardingLocale('fr'); // 'en' (fallback)
 * ```
 */
export function mapToOnboardingLocale(deviceLanguageCode: string): SupportedOnboardingLocale {
  if (deviceLanguageCode === 'es') {
    return 'es';
  }
  if (deviceLanguageCode === 'pt') {
    return 'pt';
  }
  return 'en';
}

/**
 * Get the device locale mapped to a supported onboarding locale
 *
 * Detects the device's language and maps it to a supported onboarding locale.
 * This is the main function to use when you need to determine which onboarding
 * flow to load based on the device language.
 *
 * @returns A supported onboarding locale code based on device language
 *
 * @example
 * ```typescript
 * const locale = getLocaleFromDevice(); // 'es' for Spanish device
 * ```
 */
export function getLocaleFromDevice(): SupportedOnboardingLocale {
  const deviceLanguageCode = getDeviceLanguageCode();
  return mapToOnboardingLocale(deviceLanguageCode);
}

/**
 * Check if a locale is supported by the onboarding module
 *
 * @param locale - The locale code to check
 * @returns True if the locale is supported, false otherwise
 *
 * @example
 * ```typescript
 * isOnboardingLocaleSupported('es'); // true
 * isOnboardingLocaleSupported('fr'); // false
 * ```
 */
export function isOnboardingLocaleSupported(locale: string): locale is SupportedOnboardingLocale {
  return SUPPORTED_ONBOARDING_LOCALES.includes(locale as SupportedOnboardingLocale);
}
