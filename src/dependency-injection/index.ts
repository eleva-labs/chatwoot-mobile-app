/**
 * Dependency Injection - Barrel Export
 *
 * Initialize the container explicitly:
 *   import { bootstrapDI } from '@/dependency-injection';
 *   bootstrapDI();
 *
 * Or resolve dependencies:
 *   import { resolve } from '@/dependency-injection';
 *   const service = resolve<IMyService>(TOKENS.IMyService);
 */

// Export tokens
export { AI_ASSISTANT_TOKENS, SHARED_TOKENS, DI_TOKENS } from './tokens';

// Export bootstrap functions
export {
  bootstrapDI,
  isContainerInitialized,
  validateContainerSetup,
  resetContainer,
  getInitializationTimestamp,
} from './bootstrap';

// Export container utilities
export { getContainer, resolve } from './container';
