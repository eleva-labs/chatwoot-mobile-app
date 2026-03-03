import { ZodError } from 'zod';
import * as Sentry from '@sentry/react-native';

export const handleValidationError = (
  methodName: string,
  error: ZodError<unknown>,
  rawData: unknown,
) => {
  console.error(`[ValidationError] ${methodName}:`, {
    errors: error.issues,
    rawData: JSON.stringify(rawData, null, 2),
  });

  // Log to Sentry with context
  Sentry.captureException(error, {
    tags: {
      type: 'schema_validation',
      method: methodName,
    },
    extra: {
      validationErrors: error.issues,
      rawData: rawData,
    },
    level: 'error',
  });
};

export const safeValidate = <T>(validator: (data: unknown) => T, data: unknown, fallback: T): T => {
  try {
    return validator(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn('[SafeValidate] Validation failed, using fallback:', error.issues);
      return fallback;
    }
    throw error;
  }
};
