const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);
const sentryConfig = getSentryExpoConfig(__dirname);

// Merge Sentry config with default config
const baseConfig = {
  ...defaultConfig,
  ...sentryConfig,
};

// Get the default resolver
const defaultResolver = baseConfig.resolver || {};

// Store the original resolveRequest if it exists
const originalResolveRequest = defaultResolver.resolveRequest;

// Custom resolver to handle @vercel/oidc and other Node.js-only packages
const customResolveRequest = (context, realModuleName, platform) => {
  // Mock @vercel/oidc with our mock file (used by @ai-sdk/gateway but we don't use gateway)
  if (realModuleName === '@vercel/oidc') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/__mocks__/@vercel/oidc.js'),
    };
  }
  // Use original resolver if it exists
  if (originalResolveRequest) {
    return originalResolveRequest(context, realModuleName, platform);
  }
  // Fallback to Metro's default resolver
  return context.resolveRequest(context, realModuleName, platform);
};

const config = {
  ...baseConfig,
  resolver: {
    ...defaultResolver,
    // Provide mocks for Node.js-only packages that aren't compatible with React Native
    extraNodeModules: {
      ...defaultResolver.extraNodeModules,
      // Mock @vercel/oidc (used by @ai-sdk/gateway but we don't use gateway)
      '@vercel/oidc': path.resolve(__dirname, 'src/__mocks__/@vercel/oidc.js'),
    },
    // Custom resolver to handle @vercel/oidc
    resolveRequest: customResolveRequest,
  },
};

module.exports = withStorybook(config, {
  enabled: true,
  configPath: path.resolve(__dirname, './.storybook'),
});
