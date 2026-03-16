import { apiService } from '@infrastructure/services/APIService';
import type { CustomAttributeResponse } from './customAttributeTypes';
import { transformCustomAttribute } from '@infrastructure/utils/camelCaseKeys';
import { CustomAttribute } from '@domain/types';

export class CustomAttributeService {
  static async index(): Promise<CustomAttributeResponse> {
    const response = await apiService.get<CustomAttribute[]>('custom_attribute_definitions');
    const customAttributes = response.data.map(transformCustomAttribute);
    return {
      payload: customAttributes,
    };
  }
}
