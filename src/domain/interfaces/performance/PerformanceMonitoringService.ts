import { FirebasePerformanceTypes } from '@react-native-firebase/perf';

export type PerformanceTrace = FirebasePerformanceTypes.Trace;

export interface PerformanceMonitoringService {
  setCollectionEnabled(enabled: boolean): void;
  startTrace(traceName: string): Promise<PerformanceTrace | null>;
  stopTrace(trace: PerformanceTrace | null): Promise<void>;
  markScreenTrace(screenName: string, screenClass?: string): Promise<void>;
}
