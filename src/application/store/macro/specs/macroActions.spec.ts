import { macroActions } from '../macroActions';
import { mockMacrosResponse } from './macroMockData';
import { MacroService } from '../macroService';
import { transformMacro } from '@infrastructure/utils/camelCaseKeys';

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

jest.mock('../macroService', () => ({
  MacroService: {
    index: jest.fn(),
    executeMacro: jest.fn(),
  },
}));

describe('macroActions', () => {
  it('should fetch macros successfully', async () => {
    const transformedResponse = {
      payload: mockMacrosResponse.data.payload.map(transformMacro),
    };
    (MacroService.index as jest.Mock).mockResolvedValue(transformedResponse);

    const dispatch = jest.fn();
    const getState = jest.fn();

    const result = await macroActions.fetchMacros()(dispatch, getState, {});

    expect(MacroService.index).toHaveBeenCalled();
    expect(result.payload).toEqual(transformedResponse);
  });
});
