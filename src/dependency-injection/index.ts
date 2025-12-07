/**
 * Dependency Injection - Barrel Export
 *
 * Import this module to initialize the DI container:
 *   import '@/dependency-injection';
 *
 * Or import specific functions:
 *   import { initializeContainer, resolve } from '@/dependency-injection';
 */

// Export tokens
export { AI_ASSISTANT_TOKENS, SHARED_TOKENS, DI_TOKENS } from './tokens';

// Export container functions
export { initializeContainer, getContainer, resolve } from './container';
