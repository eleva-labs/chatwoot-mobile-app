/**
 * Tests for FlowVersion Entity
 *
 * FlowVersion represents a semantic version (major.minor.patch)
 */

import { FlowVersion } from '../../../domain/entities/FlowVersion';
import { DomainError } from '../../../domain/entities/Errors';

describe('FlowVersion', () => {
  describe('create()', () => {
    it('should create valid version from string', () => {
      const version = FlowVersion.create('1.2.3');

      expect(version).toBeInstanceOf(FlowVersion);
      expect(version.toString()).toBe('1.2.3');
    });

    it('should throw error for invalid format - wrong number of parts', () => {
      expect(() => FlowVersion.create('1.2')).toThrow(DomainError);
      expect(() => FlowVersion.create('1.2.3.4')).toThrow(DomainError);
      expect(() => FlowVersion.create('1')).toThrow(DomainError);
    });

    it('should throw error for invalid format - non-numeric parts', () => {
      expect(() => FlowVersion.create('1.2.a')).toThrow(DomainError);
      expect(() => FlowVersion.create('a.b.c')).toThrow(DomainError);
      expect(() => FlowVersion.create('1.2.3-beta')).toThrow(DomainError);
    });

    it('should throw error for empty string', () => {
      expect(() => FlowVersion.create('')).toThrow(DomainError);
    });

    it('should handle zero values', () => {
      const version = FlowVersion.create('0.0.0');
      expect(version.toString()).toBe('0.0.0');
    });

    it('should handle large version numbers', () => {
      const version = FlowVersion.create('999.999.999');
      expect(version.toString()).toBe('999.999.999');
    });
  });

  describe('isValid()', () => {
    it('should return true for valid version strings', () => {
      expect(FlowVersion.isValid('1.2.3')).toBe(true);
      expect(FlowVersion.isValid('0.0.0')).toBe(true);
      expect(FlowVersion.isValid('10.20.30')).toBe(true);
    });

    it('should return false for invalid version strings', () => {
      expect(FlowVersion.isValid('1.2')).toBe(false);
      expect(FlowVersion.isValid('1.2.3.4')).toBe(false);
      expect(FlowVersion.isValid('1.2.a')).toBe(false);
      expect(FlowVersion.isValid('')).toBe(false);
      expect(FlowVersion.isValid('invalid')).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return version as string', () => {
      const version = FlowVersion.create('1.2.3');
      expect(version.toString()).toBe('1.2.3');
    });

    it('should return correct format for different versions', () => {
      expect(FlowVersion.create('0.1.0').toString()).toBe('0.1.0');
      expect(FlowVersion.create('10.20.30').toString()).toBe('10.20.30');
    });
  });

  describe('isCompatibleWith()', () => {
    it('should return true for same major version', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.5.0');
      expect(v1.isCompatibleWith(v2)).toBe(true);
    });

    it('should return false for different major versions', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('2.0.0');
      expect(v1.isCompatibleWith(v2)).toBe(false);
    });

    it('should return true when major version is 0', () => {
      const v1 = FlowVersion.create('0.1.0');
      const v2 = FlowVersion.create('0.2.0');
      expect(v1.isCompatibleWith(v2)).toBe(true);
    });
  });

  describe('isNewerThan()', () => {
    it('should return true when major version is greater', () => {
      const v1 = FlowVersion.create('2.0.0');
      const v2 = FlowVersion.create('1.9.9');
      expect(v1.isNewerThan(v2)).toBe(true);
    });

    it('should return false when major version is less', () => {
      const v1 = FlowVersion.create('1.0.0');
      const v2 = FlowVersion.create('2.0.0');
      expect(v1.isNewerThan(v2)).toBe(false);
    });

    it('should compare minor version when major is equal', () => {
      const v1 = FlowVersion.create('1.2.0');
      const v2 = FlowVersion.create('1.1.9');
      expect(v1.isNewerThan(v2)).toBe(true);
      expect(v2.isNewerThan(v1)).toBe(false);
    });

    it('should compare patch version when major and minor are equal', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.2.2');
      expect(v1.isNewerThan(v2)).toBe(true);
      expect(v2.isNewerThan(v1)).toBe(false);
    });

    it('should return false when versions are equal', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.2.3');
      expect(v1.isNewerThan(v2)).toBe(false);
    });
  });

  describe('isOlderThan()', () => {
    it('should return true when version is older', () => {
      const v1 = FlowVersion.create('1.0.0');
      const v2 = FlowVersion.create('2.0.0');
      expect(v1.isOlderThan(v2)).toBe(true);
    });

    it('should return false when version is newer', () => {
      const v1 = FlowVersion.create('2.0.0');
      const v2 = FlowVersion.create('1.0.0');
      expect(v1.isOlderThan(v2)).toBe(false);
    });

    it('should return false when versions are equal', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.2.3');
      expect(v1.isOlderThan(v2)).toBe(false);
    });

    it('should be inverse of isNewerThan', () => {
      const v1 = FlowVersion.create('1.0.0');
      const v2 = FlowVersion.create('2.0.0');
      expect(v1.isOlderThan(v2)).toBe(v2.isNewerThan(v1));
    });
  });

  describe('equals()', () => {
    it('should return true for equal versions', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.2.3');
      expect(v1.equals(v2)).toBe(true);
    });

    it('should return false for different major versions', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('2.2.3');
      expect(v1.equals(v2)).toBe(false);
    });

    it('should return false for different minor versions', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.3.3');
      expect(v1.equals(v2)).toBe(false);
    });

    it('should return false for different patch versions', () => {
      const v1 = FlowVersion.create('1.2.3');
      const v2 = FlowVersion.create('1.2.4');
      expect(v1.equals(v2)).toBe(false);
    });
  });
});
