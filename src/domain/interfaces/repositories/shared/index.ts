/**
 * Shared Repository Interfaces
 *
 * Domain contracts for cross-cutting infrastructure concerns.
 * These repositories wrap Redux state and other shared services.
 */

export type { IAuthRepository, AuthHeaders } from './IAuthRepository';
export type { ISettingsRepository } from './ISettingsRepository';
export type { IStateRepository } from './IStateRepository';
