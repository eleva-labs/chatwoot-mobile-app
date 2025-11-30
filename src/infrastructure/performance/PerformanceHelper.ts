import {
  PerformanceMonitoringService,
  PerformanceTrace,
} from '@/domain/interfaces/performance/PerformanceMonitoringService';
import { FirebasePerformanceService } from '@/infrastructure/performance/FirebasePerformanceService';

class PerformanceHelper {
  private service: PerformanceMonitoringService;

  constructor(service: PerformanceMonitoringService = new FirebasePerformanceService()) {
    this.service = service;
  }

  setCollectionEnabled(enabled: boolean) {
    this.service.setCollectionEnabled(enabled);
  }

  trackScreen(screenName: string, screenClass?: string) {
    this.service.markScreenTrace(screenName, screenClass);
  }

  startTrace(traceName: string): Promise<PerformanceTrace | null> {
    return this.service.startTrace(traceName);
  }

  stopTrace(trace: PerformanceTrace | null): Promise<void> {
    return this.service.stopTrace(trace);
  }
}

export default new PerformanceHelper();
