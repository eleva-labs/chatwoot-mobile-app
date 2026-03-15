// src/__tests__/helpers/matchers/resultMatchers.ts
// Extracted from src/modules/onboarding/__tests__/helpers/testHelpers.ts

export const resultMatchers = {
  toBeSuccess(received: { isSuccess: boolean; getError?: () => unknown }) {
    const pass = received.isSuccess;
    return {
      pass,
      message: () =>
        pass
          ? `expected Result not to be success`
          : `expected Result to be success, but got failure: ${received.getError?.()}`,
    };
  },

  toBeFailure(received: { isFailure: boolean; getValue?: () => unknown }) {
    const pass = received.isFailure;
    return {
      pass,
      message: () =>
        pass
          ? `expected Result not to be failure`
          : `expected Result to be failure, but got success: ${received.getValue?.()}`,
    };
  },

  toHaveValue(received: { isSuccess: boolean; getValue: () => unknown }, expected: unknown) {
    if (!received.isSuccess) {
      return {
        pass: false,
        message: () => `expected Result to have value, but Result is a failure`,
      };
    }
    const value = received.getValue();
    const pass = JSON.stringify(value) === JSON.stringify(expected);
    return {
      pass,
      message: () =>
        pass
          ? `expected Result not to have value ${JSON.stringify(expected)}`
          : `expected value ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`,
    };
  },

  toHaveError(received: { isFailure: boolean; getError: () => unknown }, expectedMessage?: string) {
    if (!received.isFailure) {
      return { pass: false, message: () => `expected Result to be failure` };
    }
    if (!expectedMessage) {
      return { pass: true, message: () => '' };
    }
    const error = received.getError();
    const msg = error instanceof Error ? error.message : String(error);
    const pass = msg.includes(expectedMessage);
    return {
      pass,
      message: () =>
        pass
          ? `expected error not to contain "${expectedMessage}"`
          : `expected error containing "${expectedMessage}", got "${msg}"`,
    };
  },
};

// TypeScript declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeSuccess(): R;
      toBeFailure(): R;
      toHaveValue(expected: unknown): R;
      toHaveError(expectedMessage?: string): R;
    }
  }
}
