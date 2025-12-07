/**
 * Base Use Case Interface
 *
 * Generic interface for all use cases in the application.
 * Use cases encapsulate business logic and orchestrate domain operations.
 *
 * All use case interfaces should extend this base interface.
 * Implementations live in src/application/use-cases/
 */

import type { Result } from '@/domain/shared';

/**
 * Generic use case interface
 *
 * @typeParam TParams - Input parameters type
 * @typeParam TResult - Success result type
 * @typeParam TError - Error type (defaults to Error)
 */
export interface IUseCase<TParams, TResult, TError = Error> {
  /**
   * Execute the use case
   *
   * @param params - Input parameters
   * @returns Result containing success value or error
   */
  execute(params: TParams): Promise<Result<TResult, TError>>;
}

/**
 * Use case without parameters
 */
export interface IUseCaseNoParams<TResult, TError = Error> {
  execute(): Promise<Result<TResult, TError>>;
}
