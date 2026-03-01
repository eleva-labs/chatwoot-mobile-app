import perf from '@react-native-firebase/perf';

import type { IPerformanceService, IPerformanceTrace } from '@/domain/interfaces/services/shared';
import { normalizeEventName } from '@/utils/normalizeEventName';
import { FirebasePerformanceTraceAdapter } from './adapters';

const SCREEN_TRACE_PREFIX = 'screen_';

export class FirebasePerformanceService implements IPerformanceService {
  private collectionEnabled = true;

  constructor() {
    this.setCollectionEnabled(true);
  }

  setCollectionEnabled(enabled: boolean): void {
    this.collectionEnabled = enabled;
    perf()
      .setPerformanceCollectionEnabled(enabled)
      .catch(() => {
        /* best effort */
      });
  }

  async startTrace(traceName: string): Promise<IPerformanceTrace | null> {
    if (!this.collectionEnabled || !traceName) return null;

    const normalizedName = normalizeEventName(traceName);
    if (!normalizedName) return null;

    try {
      const firebaseTrace = await perf().startTrace(normalizedName);
      return new FirebasePerformanceTraceAdapter(firebaseTrace);
    } catch {
      return null;
    }
  }

  async stopTrace(trace: IPerformanceTrace | null): Promise<void> {
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
