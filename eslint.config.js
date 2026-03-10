const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  // Global ignores (replaces .eslintignore)
  {
    ignores: ['node_modules/**', '**/*.js', '**/*.jsx', '.storybook/**'],
  },

  // Expo flat config (includes TypeScript, React, import plugin)
  ...expoConfig,

  // Prettier (must come after expo to override conflicting rules)
  prettierRecommended,

  // TypeScript-specific overrides
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    rules: {
      // Enforce no-explicit-any (not included in expo flat config but desired for code quality)
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Global custom rules
  {
    rules: {
      'prettier/prettier': 'error',

      // Basic import rules to prevent architecture violations
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../*/*', '../../*', '../../../*'],
              message:
                'Use path aliases (@domain/, @infrastructure/, @application/, @screens/, @presentation/) instead of relative imports beyond parent directory. See CLAUDE.md for path aliases.',
            },
            {
              group: ['*/screens/*/!(components|hooks|utils|types|assets)*'],
              message:
                'Do not import screen components from other features. Import from @application/store or @domain instead.',
            },
          ],
        },
      ],

      // Warn on relative parent imports (escalate to error later)
      'import/no-relative-parent-imports': 'off', // Too aggressive, handle via no-restricted-imports
    },
  },

  // Domain layer: Pure business logic (NO React, NO external dependencies)
  {
    files: ['src/domain/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-*', '@react-navigation/*', 'react-native-*'],
              message:
                'Domain layer cannot import React or React Native. Keep domain pure TypeScript.',
            },
            {
              group: ['@infrastructure/*', '@application/*', '@screens/*', '@presentation/*'],
              message:
                'Domain layer cannot import from other layers. Dependencies point inward only.',
            },
          ],
        },
      ],
    },
  },

  // Exception for pre-existing IconProps technical debt
  // IconProps in domain/types/index.ts imports react-native-svg (used by 43 icon files)
  // This violates domain layer purity but requires refactoring 43 files to fix
  // TODO: Move IconProps to @infrastructure/types/IconProps.ts in future cycle
  {
    files: ['src/domain/types/index.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Infrastructure layer: Framework adapters (CAN import domain + application)
  {
    files: ['src/infrastructure/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@screens/*', '@presentation/*'],
              message: 'Infrastructure layer cannot import from screens or presentation layers.',
            },
            // NOTE: infrastructure CAN import from @application/* (for repositories, adapters)
          ],
        },
      ],
    },
  },

  // Application layer: Orchestration (CAN import domain + infrastructure)
  {
    files: ['src/application/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@screens/*', '@presentation/*'],
              message: 'Application layer cannot import from screens or presentation layers.',
            },
          ],
        },
      ],
    },
  },

  // AI chat can import from presentation/
  {
    files: ['src/presentation/ai-chat/**/*'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);
