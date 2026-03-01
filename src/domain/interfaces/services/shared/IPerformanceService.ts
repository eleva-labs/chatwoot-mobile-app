/**
 * Performance Monitoring Service Interface
 *
 * Domain contract for performance monitoring services.
 * NO Firebase or vendor-specific types allowed here.
 */

/**
 * Abstract trace interface - infrastructure-agnostic
 */
export interface IPerformanceTrace {
  stop(): Promise<void>;
  putAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  putMetric(name: string, value: number): void;
  getMetric(name: string): number;
  incrementMetric(name: string, incrementBy: number): void;
  removeMetric(name: string): void;
}

/**
 * Performance Monitoring Service Interface
 */
export interface IPerformanceService {
  setCollectionEnabled(enabled: boolean): void;
  startTrace(traceName: string): Promise<IPerformanceTrace | null>;
  stopTrace(trace: IPerformanceTrace | null): Promise<void>;
  markScreenTrace(screenName: string, screenClass?: string): Promise<void>;
}
