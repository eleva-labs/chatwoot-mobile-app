import { create } from 'twrnc';
import { buildTwConfig } from './tailwind.config';

// Module-level mutable instance — starts as light mode
let _tailwind = create(buildTwConfig(false));

/**
 * Get the current tailwind instance.
 * Use this when you need the latest instance inside callbacks or closures.
 */
export const getTailwind = () => _tailwind;

/**
 * Rebuild the tailwind instance for a new theme mode.
 * Called by ThemeProvider when isDark changes.
 *
 * The ES module live binding via `export { _tailwind as tailwind }` ensures
 * all importers of `tailwind` see the updated instance.
 */
export const rebuildTailwind = (isDark: boolean) => {
  _tailwind = create(buildTwConfig(isDark));
};

// Named export — ES module live binding ensures importers see updates after rebuildTailwind()
export { _tailwind as tailwind };

// Backward compat — createThemedTailwind was used by the old tailwind.ts
export const createThemedTailwind = (isDark: boolean) => {
  return create(buildTwConfig(isDark));
};
