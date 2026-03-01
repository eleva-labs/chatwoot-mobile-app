module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier', 'import'],
  rules: {
    'prettier/prettier': 'error',
    
    // Basic import rules to prevent architecture violations
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['../*/*', '../../*', '../../../*'],
            message: 'Use path aliases (@domain/, @infrastructure/, @application/, @screens/, @presentation/) instead of relative imports beyond parent directory. See CLAUDE.md for path aliases.'
          },
          {
            group: ['*/screens/*/!(components|hooks|utils|types|assets)*'],
            message: 'Do not import screen components from other features. Import from @application/store or @domain instead.'
          }
        ]
      }
    ],
    
    // Warn on relative parent imports (escalate to error later)
    'import/no-relative-parent-imports': 'off' // Too aggressive, handle via no-restricted-imports
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false
      }
    },
    {
      // Domain layer: Pure business logic (NO React, NO external dependencies)
      files: ['src/domain/**/*'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-native', 'react-*', '@react-navigation/*', 'react-native-*'],
                message: 'Domain layer cannot import React or React Native. Keep domain pure TypeScript.',
              },
              {
                group: ['@infrastructure/*', '@application/*', '@screens/*', '@presentation/*'],
                message: 'Domain layer cannot import from other layers. Dependencies point inward only.',
              },
            ],
          },
        ],
      },
    },
    {
      // Infrastructure layer: Framework adapters (CAN import domain + application)
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
    {
      // Application layer: Orchestration (CAN import domain + infrastructure)
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
    {
      // AI chat can import from presentation/
      files: ['src/presentation/ai-chat/**/*'],
      rules: {
        'no-restricted-imports': 'off'
      }
    }
  ]
};
