/**
 * DI Container Bootstrap
 *
 * Explicit initialization for the dependency injection container.
 * MUST be imported after 'reflect-metadata' in App.tsx.
 *
 * Usage:
 *   import 'reflect-metadata';
 *   import { bootstrapDI } from '@/dependency-injection/bootstrap';
 *   bootstrapDI();
 */

import { container } from 'tsyringe';
import { registerSharedModule } from './modules';
import { SHARED_TOKENS } from './tokens';

// ============================================================================
// State
// ============================================================================

let isInitialized = false;
let initializationTimestamp: number | null = null;

// ============================================================================
// Bootstrap Function
// ============================================================================

export interface BootstrapOptions {
  /**
   * Enable verbose logging during initialization.
   * Default: true in DEV, false in production
   */
  verbose?: boolean;

  /**
   * Validate all tokens are registered after initialization.
   * Default: true in DEV, false in production
   */
  validate?: boolean;

  /**
   * Callback invoked after successful initialization.
   */
  onReady?: () => void;
}

/**
 * Initialize the DI container with all feature modules.
 *
 * This function is idempotent - safe to call multiple times.
 * Only the first call performs initialization.
 *
 * @param options - Bootstrap configuration options
 * @returns void
 */
export function bootstrapDI(options: BootstrapOptions = {}): void {
  if (isInitialized) {
    if (__DEV__ && options.verbose !== false) {
      console.warn('[DI Bootstrap] Already initialized, skipping');
    }
    return;
  }

  const verbose = options.verbose ?? __DEV__;
  const validate = options.validate ?? __DEV__;

  if (verbose) {
    console.warn('[DI Bootstrap] Starting initialization...');
  }

  const startTime = Date.now();

  try {
    // Register modules in dependency order
    // Shared module first (other modules may depend on shared services)
    registerSharedModule(container);

    // Mark as initialized
    isInitialized = true;
    initializationTimestamp = Date.now();

    const duration = initializationTimestamp - startTime;

    if (verbose) {
      console.warn(`[DI Bootstrap] Initialization complete (${duration}ms)`);
    }

    // Validate in DEV builds
    if (validate) {
      const validation = validateContainerSetup();
      if (!validation.valid) {
        console.error('[DI Bootstrap] Validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
      } else if (verbose) {
        console.warn(
          `[DI Bootstrap] Validation passed (${validation.tokenCount} tokens registered)`,
        );
      }
    }

    // Invoke ready callback
    options.onReady?.();
  } catch (error) {
    console.error('[DI Bootstrap] Initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  tokenCount: number;
}

/**
 * Validate that all expected tokens are registered in the container.
 *
 * @returns Validation result with any errors found
 */
export function validateContainerSetup(): ValidationResult {
  const errors: string[] = [];
  const allTokens = [...Object.values(SHARED_TOKENS)];

  for (const token of allTokens) {
    try {
      container.resolve(token);
    } catch {
      const tokenName = token.toString();
      errors.push(`Missing registration for token: ${tokenName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    tokenCount: allTokens.length,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if the DI container has been initialized.
 */
export function isContainerInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the timestamp when the container was initialized.
 * Returns null if not yet initialized.
 */
export function getInitializationTimestamp(): number | null {
  return initializationTimestamp;
}

/**
 * Reset the container state.
 * WARNING: Only use in tests!
 */
export function resetContainer(): void {
  if (!__DEV__) {
    console.warn('[DI Bootstrap] resetContainer() called in production - ignoring');
    return;
  }

  container.clearInstances();
  isInitialized = false;
  initializationTimestamp = null;
}
