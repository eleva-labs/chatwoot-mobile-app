import { apiService } from '@infrastructure/services/APIService';
import { LabelService } from '../labelService';
import { mockLabelsResponse } from './labelMockData';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

jest.mock('@infrastructure/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('@infrastructure/utils/toastUtils', () => ({
  showToast: jest.fn(),
}));

jest.mock('@infrastructure/services/APIService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('LabelService', () => {
  it('should fetch labels successfully', async () => {
    (apiService.get as jest.Mock).mockResolvedValueOnce(mockLabelsResponse);

    const response = await LabelService.index();
    expect(apiService.get).toHaveBeenCalledWith('labels');
    expect(response).toEqual(mockLabelsResponse.data);
  });
});
