/**
 * Dependency Injection Container
 *
 * Provides utilities for resolving dependencies from the DI container.
 * For initialization, use bootstrap.ts instead.
 *
 * Usage:
 *   import { resolve, getContainer } from '@/dependency-injection/container';
 *   const service = resolve<IMyService>(TOKENS.IMyService);
 */

import { container } from 'tsyringe';
import { isContainerInitialized, bootstrapDI } from './bootstrap';

// ============================================================================
// Container Access
// ============================================================================

/**
 * Get the TSyringe container instance.
 *
 * Will auto-initialize if not already initialized.
 * Prefer explicit bootstrapDI() call in App.tsx.
 */
export function getContainer() {
  if (!isContainerInitialized()) {
    if (__DEV__) {
      console.warn(
        '[DI Container] getContainer() called before explicit bootstrap. ' +
          'Consider calling bootstrapDI() in App.tsx for predictable initialization.',
      );
    }
    bootstrapDI();
  }
  return container;
}

/**
 * Resolve a dependency from the container.
 *
 * @param token - The injection token (Symbol) to resolve
 * @returns The resolved dependency
 */
export function resolve<T>(token: symbol): T {
  if (!isContainerInitialized()) {
    if (__DEV__) {
      console.warn(
        '[DI Container] resolve() called before explicit bootstrap. ' +
          'Consider calling bootstrapDI() in App.tsx for predictable initialization.',
      );
    }
    bootstrapDI();
  }
  return container.resolve<T>(token);
}

// Re-export for backward compatibility
export { bootstrapDI, isContainerInitialized } from './bootstrap';
