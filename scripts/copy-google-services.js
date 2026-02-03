#!/usr/bin/env node

/**
 * copy-google-services.js
 *
 * Copies Firebase credential files to native directories for EAS builds.
 * This script runs during eas-build-pre-install to ensure Firebase files
 * are in place before the native build starts.
 *
 * Priority order:
 * 1. EAS Secret File environment variables (for cloud builds with secrets)
 * 2. Credentials directory files (for local builds and dev)
 *
 * Environment detection:
 * - Uses ENVIRONMENT or EAS_BUILD_PROFILE to determine dev/prod
 * - Uses EAS_BUILD_PLATFORM to determine which platform files to copy
 */

const fs = require('fs');
const path = require('path');

// Colors for console output (works in EAS build logs)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Determine environment
const environment = process.env.ENVIRONMENT || process.env.EAS_BUILD_PROFILE || 'dev';
const isProd = environment === 'prod' || environment === 'production';
const platform = process.env.EAS_BUILD_PLATFORM || 'all';

log('\n📱 Firebase Google Services File Copy Script');
log('━'.repeat(50));
logInfo(`Environment: ${environment} (isProd: ${isProd})`);
logInfo(`Platform: ${platform}`);

// File paths configuration
const config = {
  android: {
    envVar: 'GOOGLE_SERVICES_JSON',
    credentialsProd: './credentials/android/google-services.json',
    credentialsDev: './credentials/android/google-services-dev.json',
    destination: './android/app/google-services.json',
  },
  ios: {
    envVar: 'GOOGLE_SERVICE_INFO_PLIST',
    credentialsProd: './credentials/ios/GoogleService-Info.plist',
    credentialsDev: './credentials/ios/GoogleService-Info-dev.plist',
    destination: './ios/GoogleService-Info.plist',
  },
};

/**
 * Copy a file with logging
 */
function copyFile(source, destination) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      logInfo(`Created directory: ${destDir}`);
    }

    fs.copyFileSync(source, destination);
    logSuccess(`Copied: ${source} → ${destination}`);
    return true;
  } catch (error) {
    logError(`Failed to copy ${source}: ${error.message}`);
    return false;
  }
}

/**
 * Check if a file exists and is not a placeholder
 */
function isValidCredentialFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, reason: 'File does not exist' };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for common placeholder patterns
    if (content.includes('YOUR_') || content.includes('PLACEHOLDER') || content.includes('placeholder-')) {
      return { valid: false, reason: 'File contains placeholder values' };
    }

    // For JSON files, try to parse and check for required fields
    if (filePath.endsWith('.json')) {
      const json = JSON.parse(content);
      if (!json.project_info || !json.client) {
        return { valid: false, reason: 'Missing required Firebase project fields' };
      }
    }

    // For plist files, check for required keys
    if (filePath.endsWith('.plist')) {
      if (!content.includes('GOOGLE_APP_ID') || !content.includes('GCM_SENDER_ID')) {
        return { valid: false, reason: 'Missing required Firebase plist keys' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: `Error reading file: ${error.message}` };
  }
}

/**
 * Process a single platform's Firebase files
 */
function processPlatform(platformName) {
  log(`\n📂 Processing ${platformName.toUpperCase()} Firebase files...`);

  const platformConfig = config[platformName];
  const envVarValue = process.env[platformConfig.envVar];

  // Priority 1: EAS Secret File environment variable
  if (envVarValue) {
    logInfo(`Found ${platformConfig.envVar} environment variable`);

    if (fs.existsSync(envVarValue)) {
      const validation = isValidCredentialFile(envVarValue);
      if (validation.valid) {
        return copyFile(envVarValue, platformConfig.destination);
      } else {
        logWarning(`EAS secret file invalid: ${validation.reason}`);
      }
    } else {
      logWarning(`EAS secret file path does not exist: ${envVarValue}`);
    }
  }

  // Priority 2: Credentials directory
  const credentialsFile = isProd ? platformConfig.credentialsProd : platformConfig.credentialsDev;
  logInfo(`Checking credentials file: ${credentialsFile}`);

  if (fs.existsSync(credentialsFile)) {
    const validation = isValidCredentialFile(credentialsFile);
    if (validation.valid) {
      return copyFile(credentialsFile, platformConfig.destination);
    } else {
      logWarning(`Credentials file invalid: ${validation.reason}`);
      logWarning('Please obtain valid Firebase credentials from the Firebase Console');
      return false;
    }
  }

  // No valid source found
  logWarning(`No valid ${platformName} Firebase file found`);
  logInfo(`Expected locations:`);
  logInfo(`  - EAS env var: ${platformConfig.envVar}`);
  logInfo(`  - Credentials: ${credentialsFile}`);

  return false;
}

// Main execution
let androidSuccess = true;
let iosSuccess = true;

if (platform === 'android' || platform === 'all') {
  androidSuccess = processPlatform('android');
}

if (platform === 'ios' || platform === 'all') {
  iosSuccess = processPlatform('ios');
}

// Summary
log('\n' + '━'.repeat(50));
log('📊 Summary:');

if (platform === 'android' || platform === 'all') {
  if (androidSuccess) {
    logSuccess('Android: Firebase file ready');
  } else {
    logWarning('Android: Firebase file missing or invalid');
  }
}

if (platform === 'ios' || platform === 'all') {
  if (iosSuccess) {
    logSuccess('iOS: Firebase file ready');
  } else {
    logWarning('iOS: Firebase file missing or invalid');
  }
}

// Determine exit code
// For EAS builds targeting a specific platform, only that platform matters
// For local dev (all), we warn but don't fail
if (platform === 'android' && !androidSuccess) {
  logError('\nBuild may fail without valid Android Firebase configuration');
  // Don't exit with error - let the build continue and fail with a clearer error
}

if (platform === 'ios' && !iosSuccess) {
  logError('\nBuild may fail without valid iOS Firebase configuration');
  // Don't exit with error - let the build continue and fail with a clearer error
}

log('\n');
