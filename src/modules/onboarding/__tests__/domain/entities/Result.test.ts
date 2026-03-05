/**
 * Tests for Result<T, E> - Railway-Oriented Programming Pattern
 *
 * The Result type encapsulates success/failure outcomes without throwing exceptions.
 * It provides a functional approach to error handling with composability via map/flatMap.
 */

import { Result } from '../../../domain/entities/Result';

describe('Result', () => {
  describe('Creation', () => {
    it('should create a success result with ok()', () => {
      const result = Result.ok(42);

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe(42);
    });

    it('should create a failure result with fail()', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail(error);

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should handle null as a success value', () => {
      const result = Result.ok(null);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeNull();
    });

    it('should handle undefined as a success value', () => {
      const result = Result.ok(undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
    });
  });

  describe('getValue()', () => {
    it('should return value for success result', () => {
      const result = Result.ok('hello');

      expect(result.getValue()).toBe('hello');
    });

    it('should throw error when calling getValue() on failure', () => {
      const result = Result.fail(new Error('Failed'));

      expect(() => result.getValue()).toThrow('Cannot get value from a failed result');
    });
  });

  describe('getError()', () => {
    it('should return error for failure result', () => {
      const error = new Error('Test error');
      const result = Result.fail(error);

      expect(result.getError()).toBe(error);
    });

    it('should throw error when calling getError() on success', () => {
      const result = Result.ok(123);

      expect(() => result.getError()).toThrow('Cannot get error from a successful result');
    });
  });

  describe('map()', () => {
    it('should transform success value', () => {
      const result = Result.ok(5);
      const mapped = result.map(x => x * 2);

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.getValue()).toBe(10);
    });

    it('should not execute map function on failure', () => {
      const mapFn = jest.fn((x: number) => x * 2);
      const result = Result.fail(new Error('Error'));
      const mapped = result.map(mapFn);

      expect(mapFn).not.toHaveBeenCalled();
      expect(mapped.isFailure).toBe(true);
      expect(mapped.getError().message).toBe('Error');
    });

    it('should chain multiple maps on success', () => {
      const result = Result.ok(10)
        .map(x => x + 5)
        .map(x => x * 2);

      expect(result.getValue()).toBe(30);
    });

    it('should transform to different type', () => {
      const result = Result.ok(42);
      const mapped = result.map(x => `Number: ${x}`);

      expect(mapped.getValue()).toBe('Number: 42');
    });
  });

  describe('flatMap()', () => {
    it('should chain results that may fail', () => {
      const divide = (x: number, y: number): Result<number, Error> =>
        y === 0 ? Result.fail(new Error('Division by zero')) : Result.ok(x / y);

      const initialResult: Result<number, Error> = Result.ok(10) as Result<number, Error>;
      const result = initialResult.flatMap(x => divide(x, 2));

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(5);
    });

    it('should propagate failure in flatMap chain', () => {
      const divide = (x: number, y: number): Result<number, Error> =>
        y === 0 ? Result.fail(new Error('Division by zero')) : Result.ok(x / y);

      const initialResult: Result<number, Error> = Result.ok(10) as Result<number, Error>;
      const result = initialResult.flatMap(x => divide(x, 0));

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('Division by zero');
    });

    it('should not execute flatMap on initial failure', () => {
      const flatMapFn = jest.fn(() => Result.ok(42));
      const result = Result.fail(new Error('Initial error')).flatMap(flatMapFn);

      expect(flatMapFn).not.toHaveBeenCalled();
      expect(result.isFailure).toBe(true);
    });

    it('should chain multiple flatMaps', () => {
      const addOne = (x: number): Result<number, Error> => Result.ok(x + 1);
      const multiplyTwo = (x: number): Result<number, Error> => Result.ok(x * 2);

      const initialResult: Result<number, Error> = Result.ok(5) as Result<number, Error>;
      const result = initialResult.flatMap(addOne).flatMap(multiplyTwo);

      expect(result.getValue()).toBe(12); // (5 + 1) * 2
    });
  });

  describe('match()', () => {
    it('should call onSuccess for success result', () => {
      const onSuccess = jest.fn((value: number) => `Success: ${value}`);
      const onFailure = jest.fn((error: Error) => `Failure: ${error.message}`);

      const result = Result.ok(42);
      const output = result.match(onSuccess, onFailure);

      expect(onSuccess).toHaveBeenCalledWith(42);
      expect(onFailure).not.toHaveBeenCalled();
      expect(output).toBe('Success: 42');
    });

    it('should call onFailure for failure result', () => {
      const onSuccess = jest.fn((value: number) => `Success: ${value}`);
      const onFailure = jest.fn((error: Error) => `Failure: ${error.message}`);

      const result = Result.fail(new Error('Test error'));
      const output = result.match(onSuccess, onFailure);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledWith(expect.any(Error));
      expect(output).toBe('Failure: Test error');
    });

    it('should support pattern matching for control flow', () => {
      const handleResult = (result: Result<number, Error>): string => {
        return result.match(
          value => `Got value: ${value}`,
          error => `Got error: ${error.message}`,
        );
      };

      expect(handleResult(Result.ok(10))).toBe('Got value: 10');
      expect(handleResult(Result.fail(new Error('Error')))).toBe('Got error: Error');
    });
  });

  describe('unwrap()', () => {
    it('should return value for success', () => {
      const result = Result.ok(42);

      expect(result.unwrap()).toBe(42);
    });

    it('should throw error for failure', () => {
      const result = Result.fail(new Error('Failed'));

      expect(() => result.unwrap()).toThrow('Failed');
    });

    it('should throw with custom message if error is not an Error instance', () => {
      const result = Result.fail('String error');

      expect(() => result.unwrap()).toThrow();
    });
  });

  describe('unwrapOr()', () => {
    it('should return value for success', () => {
      const result = Result.ok(42);

      expect(result.unwrapOr(0)).toBe(42);
    });

    it('should return default value for failure', () => {
      const result: Result<number, Error> = Result.fail(new Error('Error'));

      expect(result.unwrapOr(0)).toBe(0);
    });

    it('should handle null as default value', () => {
      const result: Result<string | null, Error> = Result.fail(new Error('Error'));

      expect(result.unwrapOr(null)).toBeNull();
    });
  });

  describe('Complex scenarios', () => {
    it('should compose complex operations safely', () => {
      const parseNumber = (str: string): Result<number, Error> => {
        const num = Number(str);
        return isNaN(num) ? Result.fail(new Error('Invalid number')) : Result.ok(num);
      };

      const validatePositive = (num: number): Result<number, Error> =>
        num > 0 ? Result.ok(num) : Result.fail(new Error('Number must be positive'));

      const double = (num: number): number => num * 2;

      // Success path
      const successResult = parseNumber('5').flatMap(validatePositive).map(double);

      expect(successResult.isSuccess).toBe(true);
      expect(successResult.getValue()).toBe(10);

      // Parsing failure
      const parseFailure = parseNumber('abc').flatMap(validatePositive).map(double);

      expect(parseFailure.isFailure).toBe(true);
      expect(parseFailure.getError().message).toBe('Invalid number');

      // Validation failure
      const validationFailure = parseNumber('-5').flatMap(validatePositive).map(double);

      expect(validationFailure.isFailure).toBe(true);
      expect(validationFailure.getError().message).toBe('Number must be positive');
    });

    it('should handle async operations pattern', async () => {
      const fetchData = async (): Promise<Result<string, Error>> => {
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));
          return Result.ok('data');
        } catch (error) {
          return Result.fail(error as Error);
        }
      };

      const result = await fetchData();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe('data');
    });

    it('should support combining multiple results', () => {
      const combineResults = (
        r1: Result<number, Error>,
        r2: Result<number, Error>,
      ): Result<number, Error> => {
        return r1.flatMap(v1 => r2.map(v2 => v1 + v2));
      };

      const success = combineResults(Result.ok(5), Result.ok(10));
      expect(success.getValue()).toBe(15);

      const failure1 = combineResults(Result.fail(new Error('Error 1')), Result.ok(10));
      expect(failure1.getError().message).toBe('Error 1');

      const failure2 = combineResults(Result.ok(5), Result.fail(new Error('Error 2')));
      expect(failure2.getError().message).toBe('Error 2');
    });
  });
});
