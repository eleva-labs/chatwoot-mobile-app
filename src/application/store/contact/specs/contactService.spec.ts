import { ContactService } from '../contactService';
import { apiService } from '@infrastructure/services/APIService';
import { mockContactLabelsResponse } from './contactMockData';

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

describe('ContactService', () => {
  it('should get contact labels', async () => {
    (apiService.get as jest.Mock).mockResolvedValueOnce(mockContactLabelsResponse);

    const result = await ContactService.getContactLabels({ contactId: 1 });
    expect(apiService.get).toHaveBeenCalledWith('contacts/1/labels');
    expect(result).toEqual(mockContactLabelsResponse.data);
  });
});
