import type { Team } from '@domain/types';
import { apiService } from '@infrastructure/services/APIService';
import { transformTeam } from '@infrastructure/utils/camelCaseKeys';

export class TeamService {
  static async getTeams(): Promise<Team[]> {
    const response = await apiService.get<Team[]>('teams');
    const teams = response.data.map(transformTeam);
    return teams;
  }
}
