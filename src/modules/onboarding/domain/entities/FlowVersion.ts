import { DomainError } from './Errors';

/**
 * FlowVersion Value Object
 *
 * Represents a semantic version (major.minor.patch)
 * Immutable and validated on creation.
 */
export class FlowVersion {
  private constructor(
    private readonly major: number,
    private readonly minor: number,
    private readonly patch: number,
  ) {}

  static create(version: string): FlowVersion {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new DomainError(`Invalid version format: ${version}. Expected: "major.minor.patch"`);
    }
    return new FlowVersion(parts[0], parts[1], parts[2]);
  }

  static isValid(version: string): boolean {
    try {
      FlowVersion.create(version);
      return true;
    } catch {
      return false;
    }
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  /**
   * Check if this version is compatible with another (same major version)
   */
  isCompatibleWith(other: FlowVersion): boolean {
    return this.major === other.major;
  }

  /**
   * Check if this version is newer than another
   */
  isNewerThan(other: FlowVersion): boolean {
    if (this.major !== other.major) {
      return this.major > other.major;
    }
    if (this.minor !== other.minor) {
      return this.minor > other.minor;
    }
    return this.patch > other.patch;
  }

  /**
   * Check if this version is older than another
   */
  isOlderThan(other: FlowVersion): boolean {
    return other.isNewerThan(this);
  }

  equals(other: FlowVersion): boolean {
    return this.major === other.major && this.minor === other.minor && this.patch === other.patch;
  }
}
