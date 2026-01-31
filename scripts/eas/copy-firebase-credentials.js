#!/usr/bin/env node

/**
 * Copy Google Services Script for EAS Builds
 *
 * This script is called during EAS cloud builds to write Firebase credential
 * files from EAS Secret environment variables to the credentials directory.
 *
 * EAS Secrets are set in the Expo dashboard and injected as environment variables
 * during cloud builds. This script reads those variables and writes them to files.
 *
 * Usage: node scripts/copy-google-services.js
 * Called from: scripts/eas-build-pre-install.sh
 */

const fs = require('fs');
const path = require('path');

const CREDENTIALS_DIR = path.join(__dirname, '..', 'credentials');
const ANDROID_DIR = path.join(CREDENTIALS_DIR, 'android');
const IOS_DIR = path.join(CREDENTIALS_DIR, 'ios');

// Determine environment from EAS build profile
const isProd =
  process.env.ENVIRONMENT === 'prod' || process.env.EAS_BUILD_PROFILE === 'production';

console.log('[copy-google-services] Starting...');
console.log('[copy-google-services] Environment:', process.env.ENVIRONMENT || 'not set');
console.log('[copy-google-services] EAS_BUILD_PROFILE:', process.env.EAS_BUILD_PROFILE || 'not set');
console.log('[copy-google-services] isProd:', isProd);

// Ensure directories exist
if (!fs.existsSync(ANDROID_DIR)) {
  fs.mkdirSync(ANDROID_DIR, { recursive: true });
  console.log('[copy-google-services] Created directory:', ANDROID_DIR);
}

if (!fs.existsSync(IOS_DIR)) {
  fs.mkdirSync(IOS_DIR, { recursive: true });
  console.log('[copy-google-services] Created directory:', IOS_DIR);
}

let filesWritten = 0;

// Handle Android google-services.json
// EAS can provide this as either a file path or JSON content
const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;
if (googleServicesJson) {
  const androidFileName = isProd ? 'google-services.json' : 'google-services-dev.json';
  const androidFilePath = path.join(ANDROID_DIR, androidFileName);

  try {
    // Check if it's a file path that exists
    if (fs.existsSync(googleServicesJson)) {
      // It's a file path - copy the file
      fs.copyFileSync(googleServicesJson, androidFilePath);
      console.log(`[copy-google-services] Copied Android credentials from: ${googleServicesJson}`);
    } else {
      // Try to parse as JSON content
      JSON.parse(googleServicesJson); // Validate it's valid JSON
      fs.writeFileSync(androidFilePath, googleServicesJson, 'utf8');
      console.log(`[copy-google-services] Wrote Android credentials from env content`);
    }
    console.log(`[copy-google-services] ✓ Android: ${androidFilePath}`);
    filesWritten++;
  } catch (error) {
    console.error(`[copy-google-services] ✗ Failed to process Android credentials:`, error.message);
  }
} else {
  console.log('[copy-google-services] GOOGLE_SERVICES_JSON not set, skipping Android');
}

// Handle iOS GoogleService-Info.plist
// EAS can provide this as either a file path or plist content
const googleServiceInfoPlist = process.env.GOOGLE_SERVICE_INFO_PLIST;
if (googleServiceInfoPlist) {
  const iosFileName = isProd ? 'GoogleService-Info.plist' : 'GoogleService-Info-dev.plist';
  const iosFilePath = path.join(IOS_DIR, iosFileName);

  try {
    // Check if it's a file path that exists
    if (fs.existsSync(googleServiceInfoPlist)) {
      // It's a file path - copy the file
      fs.copyFileSync(googleServiceInfoPlist, iosFilePath);
      console.log(`[copy-google-services] Copied iOS credentials from: ${googleServiceInfoPlist}`);
    } else {
      // Assume it's plist content
      fs.writeFileSync(iosFilePath, googleServiceInfoPlist, 'utf8');
      console.log(`[copy-google-services] Wrote iOS credentials from env content`);
    }
    console.log(`[copy-google-services] ✓ iOS: ${iosFilePath}`);
    filesWritten++;
  } catch (error) {
    console.error(`[copy-google-services] ✗ Failed to process iOS credentials:`, error.message);
  }
} else {
  console.log('[copy-google-services] GOOGLE_SERVICE_INFO_PLIST not set, skipping iOS');
}

// Summary
console.log('[copy-google-services] Complete!');
console.log(`[copy-google-services] Files written: ${filesWritten}`);

if (filesWritten === 0) {
  console.log('[copy-google-services] ⚠️  No credentials were written.');
  console.log('[copy-google-services] This is normal for local builds without EAS secrets.');
  console.log('[copy-google-services] Falling back to credentials/ directory files or placeholders.');
}
