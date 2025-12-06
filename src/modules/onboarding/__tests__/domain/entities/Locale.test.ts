/**
 * Tests for Locale Entity
 *
 * Locale is a value object that represents a valid locale identifier.
 */

import { Locale } from '../../../domain/entities/Locale';
import { DomainError } from '../../../domain/entities/Errors';

describe('Locale', () => {
  describe('create()', () => {
    it('should create a valid locale with language code only', () => {
      const locale = Locale.create('en');

      expect(locale).toBeInstanceOf(Locale);
      expect(locale.toString()).toBe('en');
    });

    it('should create a valid locale with language and country code', () => {
      const locale = Locale.create('en-US');

      expect(locale).toBeInstanceOf(Locale);
      expect(locale.toString()).toBe('en-US');
    });

    it('should throw DomainError for invalid locale format', () => {
      expect(() => Locale.create('invalid')).toThrow(DomainError);
      expect(() => Locale.create('invalid')).toThrow('Invalid locale: invalid');
    });

    it('should throw DomainError for empty string', () => {
      expect(() => Locale.create('')).toThrow(DomainError);
    });

    it('should throw DomainError for uppercase language code', () => {
      expect(() => Locale.create('EN')).toThrow(DomainError);
    });

    it('should throw DomainError for lowercase country code', () => {
      expect(() => Locale.create('en-us')).toThrow(DomainError);
    });

    it('should throw DomainError for invalid format with numbers', () => {
      expect(() => Locale.create('en123')).toThrow(DomainError);
    });

    it('should throw DomainError for locale with too many parts', () => {
      expect(() => Locale.create('en-US-CA')).toThrow(DomainError);
    });
  });

  describe('isValid()', () => {
    it('should return true for valid language code only', () => {
      expect(Locale.isValid('en')).toBe(true);
      expect(Locale.isValid('es')).toBe(true);
      expect(Locale.isValid('pt')).toBe(true);
      expect(Locale.isValid('fr')).toBe(true);
    });

    it('should return true for valid language and country code', () => {
      expect(Locale.isValid('en-US')).toBe(true);
      expect(Locale.isValid('es-ES')).toBe(true);
      expect(Locale.isValid('pt-BR')).toBe(true);
      expect(Locale.isValid('fr-FR')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(Locale.isValid('')).toBe(false);
      expect(Locale.isValid('invalid')).toBe(false);
      expect(Locale.isValid('EN')).toBe(false);
      expect(Locale.isValid('en-us')).toBe(false);
      expect(Locale.isValid('en123')).toBe(false);
      expect(Locale.isValid('en-US-CA')).toBe(false);
      expect(Locale.isValid('123')).toBe(false);
      expect(Locale.isValid('en-')).toBe(false);
      expect(Locale.isValid('-US')).toBe(false);
    });

    it('should return false for single character', () => {
      expect(Locale.isValid('e')).toBe(false);
    });

    it('should return false for three character language code', () => {
      expect(Locale.isValid('eng')).toBe(false);
    });

    it('should return false for country code with more than 2 characters', () => {
      expect(Locale.isValid('en-USA')).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return the locale value', () => {
      const locale = Locale.create('en');
      expect(locale.toString()).toBe('en');
    });

    it('should return the full locale value with country code', () => {
      const locale = Locale.create('en-US');
      expect(locale.toString()).toBe('en-US');
    });
  });

  describe('equals()', () => {
    it('should return true for equal locales', () => {
      const locale1 = Locale.create('en');
      const locale2 = Locale.create('en');

      expect(locale1.equals(locale2)).toBe(true);
    });

    it('should return true for equal locales with country code', () => {
      const locale1 = Locale.create('en-US');
      const locale2 = Locale.create('en-US');

      expect(locale1.equals(locale2)).toBe(true);
    });

    it('should return false for different locales', () => {
      const locale1 = Locale.create('en');
      const locale2 = Locale.create('es');

      expect(locale1.equals(locale2)).toBe(false);
    });

    it('should return false when comparing language-only with language-country', () => {
      const locale1 = Locale.create('en');
      const locale2 = Locale.create('en-US');

      expect(locale1.equals(locale2)).toBe(false);
    });

    it('should return false when comparing different country codes', () => {
      const locale1 = Locale.create('en-US');
      const locale2 = Locale.create('en-GB');

      expect(locale1.equals(locale2)).toBe(false);
    });
  });

  describe('getLanguageCode()', () => {
    it('should return language code for language-only locale', () => {
      const locale = Locale.create('en');
      expect(locale.getLanguageCode()).toBe('en');
    });

    it('should return language code for locale with country code', () => {
      const locale = Locale.create('en-US');
      expect(locale.getLanguageCode()).toBe('en');
    });

    it('should return correct language code for different languages', () => {
      expect(Locale.create('es').getLanguageCode()).toBe('es');
      expect(Locale.create('pt-BR').getLanguageCode()).toBe('pt');
      expect(Locale.create('fr-FR').getLanguageCode()).toBe('fr');
    });
  });

  describe('getCountryCode()', () => {
    it('should return null for language-only locale', () => {
      const locale = Locale.create('en');
      expect(locale.getCountryCode()).toBeNull();
    });

    it('should return country code for locale with country code', () => {
      const locale = Locale.create('en-US');
      expect(locale.getCountryCode()).toBe('US');
    });

    it('should return correct country code for different locales', () => {
      expect(Locale.create('en-GB').getCountryCode()).toBe('GB');
      expect(Locale.create('es-ES').getCountryCode()).toBe('ES');
      expect(Locale.create('pt-BR').getCountryCode()).toBe('BR');
      expect(Locale.create('fr-FR').getCountryCode()).toBe('FR');
    });

    it('should return null when country code is not present', () => {
      expect(Locale.create('en').getCountryCode()).toBeNull();
      expect(Locale.create('es').getCountryCode()).toBeNull();
      expect(Locale.create('pt').getCountryCode()).toBeNull();
    });
  });
});
