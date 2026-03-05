/**
 * Test Helpers and Utilities
 *
 * Common test utilities, assertions, and helper functions.
 */

import { Result } from '../../domain/entities/Result';
import type { Answer } from '../../domain/entities/Answer';

/**
 * Custom Jest matchers for Result type
 */
export const resultMatchers = {
  toBeSuccess(received: Result<unknown, unknown>) {
    const pass = received.isSuccess;
    return {
      pass,
      message: () =>
        pass
          ? `expected Result not to be success`
          : `expected Result to be success, but got failure: ${received.getError()}`,
    };
  },

  toBeFailure(received: Result<unknown, unknown>) {
    const pass = received.isFailure;
    return {
      pass,
      message: () =>
        pass
          ? `expected Result not to be failure`
          : `expected Result to be failure, but got success: ${received.getValue()}`,
    };
  },

  toHaveValue(received: Result<unknown, unknown>, expected: unknown) {
    if (!received.isSuccess) {
      return {
        pass: false,
        message: () => `expected Result to have value ${expected}, but Result is a failure`,
      };
    }

    const value = received.getValue();
    const pass = JSON.stringify(value) === JSON.stringify(expected);

    return {
      pass,
      message: () =>
        pass
          ? `expected Result not to have value ${expected}`
          : `expected Result to have value ${expected}, but got ${value}`,
    };
  },

  toHaveError(received: Result<unknown, unknown>, expectedMessage?: string) {
    if (!received.isFailure) {
      return {
        pass: false,
        message: () => `expected Result to have error, but Result is a success`,
      };
    }

    const error = received.getError();
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (expectedMessage) {
      const pass = errorMessage.includes(expectedMessage);
      return {
        pass,
        message: () =>
          pass
            ? `expected Result not to have error message containing "${expectedMessage}"`
            : `expected Result to have error message containing "${expectedMessage}", but got "${errorMessage}"`,
      };
    }

    return {
      pass: true,
      message: () => ``,
    };
  },
};

/**
 * Wait for a condition to be true (useful for async operations)
 */
export const waitFor = async (
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> => {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timed out');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

/**
 * Create a promise that resolves/rejects after a delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const delayedResolve = <T>(value: T, ms: number): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
};

export const delayedReject = (error: Error, ms: number): Promise<never> => {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
};

/**
 * Create a spy function with call tracking
 */
export const createSpy = <T extends (...args: unknown[]) => unknown>(): jest.Mock<
  ReturnType<T>,
  Parameters<T>
> => {
  return jest.fn();
};

/**
 * Answer comparison helpers
 */
export const answersEqual = (a: Answer[], b: Answer[]): boolean => {
  if (a.length !== b.length) return false;

  return a.every(answer1 => {
    const answer2 = b.find(a => a.questionId.equals(answer1.questionId));
    return answer2 && answer1.equals(answer2);
  });
};

/**
 * Mock timers helpers
 */
export const advanceTimersByTime = (ms: number): void => {
  jest.advanceTimersByTime(ms);
};

export const runAllTimers = (): void => {
  jest.runAllTimers();
};

/**
 * Console suppression for expected errors
 */
export const suppressConsoleError = (fn: () => void | Promise<void>) => {
  const originalError = console.error;
  console.error = jest.fn();
  try {
    return fn();
  } finally {
    console.error = originalError;
  }
};

/**
 * Create test date at specific time
 */
export const testDate = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Freeze time for testing time-dependent code
 */
export const freezeTime = (date: Date = new Date('2024-01-01T00:00:00Z')): void => {
  jest.useFakeTimers();
  jest.setSystemTime(date);
};

export const unfreezeTime = (): void => {
  jest.useRealTimers();
};

/**
 * Network simulation helpers
 */
export const simulateNetworkDelay = async (ms = 100): Promise<void> => {
  await delay(ms);
};

export const simulateNetworkError = (): Error => {
  const error = new Error('Network request failed');
  error.name = 'NetworkError';
  return error;
};

/**
 * Random data generators
 */
export const randomString = (length = 10): string => {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
};

export const randomNumber = (min = 0, max = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomBoolean = (): boolean => {
  return Math.random() < 0.5;
};

/**
 * Assertion helpers
 */
export const expectToThrow = (fn: () => void, expectedError?: string | RegExp): void => {
  expect(fn).toThrow(expectedError);
};

export const expectToThrowAsync = async (
  fn: () => Promise<void>,
  expectedError?: string | RegExp,
): Promise<void> => {
  await expect(fn()).rejects.toThrow(expectedError);
};
