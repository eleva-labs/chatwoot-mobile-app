import type { IPerformanceService, IPerformanceTrace } from '@/domain/interfaces/services/shared';
import { FirebasePerformanceService } from './FirebasePerformanceService';

class PerformanceHelper {
  private service: IPerformanceService;

  constructor(service: IPerformanceService = new FirebasePerformanceService()) {
    this.service = service;
  }

  setCollectionEnabled(enabled: boolean) {
    this.service.setCollectionEnabled(enabled);
  }

  trackScreen(screenName: string, screenClass?: string) {
    this.service.markScreenTrace(screenName, screenClass);
  }

  startTrace(traceName: string): Promise<IPerformanceTrace | null> {
    return this.service.startTrace(traceName);
  }

  stopTrace(trace: IPerformanceTrace | null): Promise<void> {
    return this.service.stopTrace(trace);
  }
}

export default new PerformanceHelper();
