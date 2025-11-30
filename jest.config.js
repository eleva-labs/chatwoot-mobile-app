module.exports = {
  preset: 'react-native',
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|@reduxjs|immer)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/helpers/',
    '/__tests__/setup\\.ts$',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/modules/onboarding/__tests__/setup.ts'],
  testEnvironment: 'node',
};
