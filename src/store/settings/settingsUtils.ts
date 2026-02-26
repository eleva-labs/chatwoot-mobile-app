import { showToast } from '@/utils/toastUtils';
import I18n from '@/i18n';

export const handleApiError = (error: unknown, customErrorMsg?: string) => {
  const errorMessage = error instanceof Error ? error.message : I18n.t('CONFIGURE_URL.ERROR');
  showToast({ message: errorMessage });
  return errorMessage;
};

export const extractDomain = ({ url }: { url: string }) => {
  const isValidUrl = checkValidUrl({ url });

  if (!isValidUrl) {
    return url;
  }
  try {
    const parsed = new URL(url);
    // Preserve host (includes port) for local development (e.g. localhost:3000)
    return parsed.host;
  } catch {
    // Fallback to regex extraction
    const domain = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (
      domain != null &&
      domain.length > 2 &&
      typeof domain[2] === 'string' &&
      domain[2].length > 0
    ) {
      return domain[2];
    }
    return url;
  }
};

export const checkValidUrl = ({ url }: { url: string }) => {
  try {
    return Boolean(new URL(url));
  } catch (e) {
    return e;
  }
};
