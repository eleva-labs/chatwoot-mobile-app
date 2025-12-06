/**
 * Expo Config Plugin: Firebase Safety Check
 *
 * This plugin modifies the iOS AppDelegate to check for placeholder Firebase credentials
 * before initializing Firebase. If placeholder credentials are detected, Firebase
 * initialization is skipped to prevent app crashes during local development.
 *
 * IMPORTANT: This plugin MUST be listed AFTER @react-native-firebase/app in the plugins
 * array because it modifies the [FIRApp configure] call that the Firebase plugin adds.
 *
 * Placeholder credentials are detected by checking for:
 * - API_KEY containing "placeholder"
 * - GCM_SENDER_ID being all zeros (000000000000)
 * - PROJECT_ID containing "placeholder"
 *
 * @see https://docs.expo.dev/config-plugins/plugins/
 * @see https://github.com/invertase/react-native-firebase/blob/main/packages/app/plugin/src/ios/appDelegate.ts
 */

const { withAppDelegate } = require('expo/config-plugins');

// Marker comment to ensure idempotency - if this exists, we've already modified the file
const IDEMPOTENCY_MARKER = '// @firebase-safety-check';

/**
 * Code to inject that checks for placeholder credentials
 * Replaces the simple [FIRApp configure] call with a conditional version
 */
const FIREBASE_SAFETY_CHECK_CODE = `${IDEMPOTENCY_MARKER}
  // Firebase Safety Check - Skip initialization with placeholder credentials
  // This allows developers to build and run the app without real Firebase credentials
  BOOL shouldInitializeFirebase = YES;
  NSString *googleServicePath = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (googleServicePath) {
    NSDictionary *googleServiceInfo = [NSDictionary dictionaryWithContentsOfFile:googleServicePath];
    NSString *apiKey = googleServiceInfo[@"API_KEY"];
    NSString *gcmSenderId = googleServiceInfo[@"GCM_SENDER_ID"];
    NSString *projectId = googleServiceInfo[@"PROJECT_ID"];

    // Check for placeholder patterns used by setup-credentials.sh
    BOOL isPlaceholder = NO;
    if (apiKey && [apiKey rangeOfString:@"placeholder" options:NSCaseInsensitiveSearch].location != NSNotFound) {
      isPlaceholder = YES;
    }
    if (gcmSenderId && [gcmSenderId isEqualToString:@"000000000000"]) {
      isPlaceholder = YES;
    }
    if (projectId && [projectId rangeOfString:@"placeholder" options:NSCaseInsensitiveSearch].location != NSNotFound) {
      isPlaceholder = YES;
    }

    if (isPlaceholder) {
      NSLog(@"[Firebase] Placeholder credentials detected - skipping Firebase initialization");
      NSLog(@"[Firebase] Push notifications will NOT work until real credentials are added");
      NSLog(@"[Firebase] See: credentials/README.md for setup instructions");
      shouldInitializeFirebase = NO;
    }
  } else {
    NSLog(@"[Firebase] GoogleService-Info.plist not found - skipping Firebase initialization");
    shouldInitializeFirebase = NO;
  }

  if (shouldInitializeFirebase) {
    [FIRApp configure];
  }`;

/**
 * Modifies the AppDelegate to add Firebase safety check
 * @param {string} contents - The AppDelegate file contents
 * @returns {string} - Modified contents
 */
function modifyAppDelegate(contents) {
  // Check for idempotency - don't modify if we've already added our code
  if (contents.includes(IDEMPOTENCY_MARKER)) {
    console.log('  [with-firebase-safety] Already modified, skipping');
    return contents;
  }

  // Pattern to find [FIRApp configure] call added by @react-native-firebase/app
  const firebaseConfigurePattern = /\[FIRApp configure\];/;

  if (!firebaseConfigurePattern.test(contents)) {
    console.warn('  [with-firebase-safety] Could not find [FIRApp configure] in AppDelegate');
    console.warn('  [with-firebase-safety] Make sure this plugin is listed AFTER @react-native-firebase/app');
    return contents;
  }

  // Replace [FIRApp configure]; with our safety-checked version
  const modifiedContents = contents.replace(
    firebaseConfigurePattern,
    FIREBASE_SAFETY_CHECK_CODE
  );

  console.log('  [with-firebase-safety] Added Firebase placeholder credential check to AppDelegate');

  return modifiedContents;
}

/**
 * Main plugin function
 * Uses withAppDelegate mod to modify the iOS AppDelegate file
 */
const withFirebaseSafety = (config) => {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'objcpp' || config.modResults.language === 'objc') {
      config.modResults.contents = modifyAppDelegate(config.modResults.contents);
    } else {
      console.warn('  [with-firebase-safety] AppDelegate is not Objective-C/C++, skipping modification');
    }
    return config;
  });
};

module.exports = withFirebaseSafety;
