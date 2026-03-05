import { apiService } from '@/services/APIService';
import type { DashboardAppResponse } from './dashboardAppTypes';
import { transformDashboardApp } from '@infrastructure/utils/camelCaseKeys';
import { DashboardApp } from '@domain/types';

export class DashboardAppService {
  static async index(): Promise<DashboardAppResponse> {
    const response = await apiService.get<DashboardApp[]>('dashboard_apps');
    const dashboardApps = response.data.map(transformDashboardApp);
    return {
      payload: dashboardApps,
    };
  }
}
