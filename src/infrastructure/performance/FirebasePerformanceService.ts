import perf from '@react-native-firebase/perf';

import {
  PerformanceMonitoringService,
  PerformanceTrace,
} from '@/domain/interfaces/performance/PerformanceMonitoringService';
import { normalizeEventName } from '@/utils/normalizeEventName';

const SCREEN_TRACE_PREFIX = 'screen_';

export class FirebasePerformanceService implements PerformanceMonitoringService {
  private collectionEnabled = true;

  constructor() {
    this.setCollectionEnabled(true);
  }

  setCollectionEnabled(enabled: boolean) {
    this.collectionEnabled = enabled;
    perf()
      .setPerformanceCollectionEnabled(enabled)
      .catch(() => {
        /* best effort */
      });
  }

  async startTrace(traceName: string): Promise<PerformanceTrace | null> {
    if (!this.collectionEnabled || !traceName) return null;

    const normalizedName = normalizeEventName(traceName);
    if (!normalizedName) return null;

    try {
      return await perf().startTrace(normalizedName);
    } catch {
      return null;
    }
  }

  async stopTrace(trace: PerformanceTrace | null): Promise<void> {
    if (!trace) return;
    try {
      await trace.stop();
    } catch {
      /* best effort */
    }
  }

  async markScreenTrace(screenName: string, screenClass?: string): Promise<void> {
    if (!this.collectionEnabled) return;

    const normalizedName = normalizeEventName(screenName || screenClass || '');
    if (!normalizedName) return;

    const trace = await this.startTrace(`${SCREEN_TRACE_PREFIX}${normalizedName}`);
    await this.stopTrace(trace);
  }
}
