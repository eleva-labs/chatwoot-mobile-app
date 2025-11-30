/**
 * Result Pattern (Railway-Oriented Programming)
 *
 * Provides explicit error handling without exceptions.
 * This pattern makes error handling predictable and composable.
 */
export class Result<T, E = Error> {
  private constructor(
    private readonly _value?: T,
    private readonly _error?: E,
    private readonly _isSuccess: boolean = true,
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result<T, never>(value, undefined, true);
  }

  static fail<E>(error: E): Result<never, E> {
    return new Result<never, E>(undefined, error, false);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }

  /**
   * Functor pattern - transform the value if successful
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value!));
    }
    return Result.fail(this._error!);
  }

  /**
   * Monad pattern - chain operations that return Results
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value!);
    }
    return Result.fail(this._error!);
  }

  /**
   * Transform error if failed
   */
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isFailure) {
      return Result.fail(fn(this._error!));
    }
    return Result.ok(this._value!);
  }

  /**
   * Pattern matching - handle both success and failure cases
   */
  match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    return this._isSuccess ? onSuccess(this._value!) : onFailure(this._error!);
  }

  /**
   * Get value or throw if failed
   * Use with caution - prefer match() or explicit checks
   */
  unwrap(): T {
    if (this.isFailure) {
      throw this._error;
    }
    return this._value!;
  }

  /**
   * Get value or return default
   */
  unwrapOr(defaultValue: T): T {
    return this._isSuccess ? this._value! : defaultValue;
  }
}
