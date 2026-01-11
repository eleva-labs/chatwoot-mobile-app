/**
 * Shared Service Interfaces - Barrel Export
 *
 * Contracts for shared services used across features.
 * Implementations live in src/infrastructure/services/shared/
 */

export type { IAIChatConfigService } from './IAIChatConfigService';
export type { IAnalyticsService, AnalyticsEventParams } from './IAnalyticsService';
export type { IPerformanceService, IPerformanceTrace } from './IPerformanceService';
