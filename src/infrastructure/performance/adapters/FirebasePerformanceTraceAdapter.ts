/**
 * Firebase Performance Trace Adapter
 *
 * Wraps Firebase's Trace to implement IPerformanceTrace.
 */

import { FirebasePerformanceTypes } from '@react-native-firebase/perf';
import type { IPerformanceTrace } from '@/domain/interfaces/services/shared';

export class FirebasePerformanceTraceAdapter implements IPerformanceTrace {
  constructor(private readonly firebaseTrace: FirebasePerformanceTypes.Trace) {}

  async stop(): Promise<void> {
    await this.firebaseTrace.stop();
  }

  putAttribute(name: string, value: string): void {
    this.firebaseTrace.putAttribute(name, value);
  }

  getAttribute(name: string): string | null {
    return this.firebaseTrace.getAttribute(name);
  }

  putMetric(name: string, value: number): void {
    this.firebaseTrace.putMetric(name, value);
  }

  getMetric(name: string): number {
    return this.firebaseTrace.getMetric(name);
  }

  incrementMetric(name: string, incrementBy: number): void {
    this.firebaseTrace.incrementMetric(name, incrementBy);
  }

  removeMetric(name: string): void {
    this.firebaseTrace.removeMetric(name);
  }
}
