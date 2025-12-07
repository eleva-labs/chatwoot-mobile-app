/**
 * Dependency Injection Container
 *
 * Composes all feature modules to create the application's DI container.
 * This file should be imported once at app startup (e.g., in App.tsx or index.ts).
 *
 * Usage:
 *   import '@/dependency-injection/container';
 *   // or
 *   import { initializeContainer } from '@/dependency-injection/container';
 *   initializeContainer();
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

// Feature Modules
import { registerSharedModule, registerAIAssistantModule } from './modules';

// ============================================================================
// Container Initialization
// ============================================================================

let isInitialized = false;

/**
 * Initialize the DI container with all feature modules.
 * Safe to call multiple times - will only register once.
 */
export function initializeContainer(): void {
  if (isInitialized) {
    return;
  }

  // Register modules in dependency order
  // (shared first, then features that depend on shared)
  registerSharedModule(container);
  registerAIAssistantModule(container);

  isInitialized = true;

  if (__DEV__) {
    console.log('[DI Container] Initialized successfully');
  }
}

/**
 * Get the TSyringe container instance.
 * Useful for resolving dependencies manually.
 */
export function getContainer() {
  if (!isInitialized) {
    initializeContainer();
  }
  return container;
}

/**
 * Resolve a dependency from the container.
 * Shorthand for container.resolve().
 */
export function resolve<T>(token: symbol): T {
  if (!isInitialized) {
    initializeContainer();
  }
  return container.resolve<T>(token);
}

// Auto-initialize when this module is imported
initializeContainer();
