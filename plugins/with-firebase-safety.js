/**
 * Expo Config Plugin: Firebase Safety Check
 *
 * This plugin does two things:
 *
 * 1. **AppDelegate Safety Check**: Modifies the iOS AppDelegate to check for placeholder
 *    Firebase credentials before initializing Firebase. If placeholder credentials are
 *    detected, Firebase initialization is skipped to prevent app crashes during local
 *    development.
 *
 * 2. **Non-Modular Header Fix**: Injects a Podfile post_install modification to set
 *    CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES for Firebase and RNFB
 *    pods. This is required when using `useFrameworks: 'static'` because Firebase's
 *    native modules import React Native headers that aren't modular, causing build
 *    errors: "include of non-modular header inside framework module 'RNFBApp'"
 *
 * IMPORTANT: This plugin MUST be listed AFTER @react-native-firebase/app in the plugins
 * array because it modifies the FirebaseApp.configure() / [FIRApp configure] call that
 * the Firebase plugin adds.
 *
 * Supports both Swift (SDK 55+) and Objective-C AppDelegates.
 *
 * Placeholder credentials are detected by checking for:
 * - API_KEY containing "placeholder"
 * - GCM_SENDER_ID being all zeros (000000000000)
 * - PROJECT_ID containing "placeholder"
 *
 * @see https://docs.expo.dev/config-plugins/plugins/
 * @see https://github.com/invertase/react-native-firebase/blob/main/packages/app/plugin/src/ios/appDelegate.ts
 */

const { withAppDelegate, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Marker comment to ensure idempotency - if this exists, we've already modified the file
const IDEMPOTENCY_MARKER = '// @firebase-safety-check';

// ---------------------------------------------------------------------------
// Swift AppDelegate replacement
// ---------------------------------------------------------------------------
const SWIFT_FIREBASE_SAFETY_CHECK = `${IDEMPOTENCY_MARKER}
    // Firebase Safety Check – skip initialization with placeholder credentials
    // This allows developers to build and run the app without real Firebase credentials
    var shouldInitializeFirebase = true
    if let plistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
       let plistDict = NSDictionary(contentsOfFile: plistPath) as? [String: Any] {
      let apiKey = plistDict["API_KEY"] as? String ?? ""
      let gcmSenderId = plistDict["GCM_SENDER_ID"] as? String ?? ""
      let projectId = plistDict["PROJECT_ID"] as? String ?? ""

      let isPlaceholder =
        apiKey.localizedCaseInsensitiveContains("placeholder") ||
        gcmSenderId == "000000000000" ||
        projectId.localizedCaseInsensitiveContains("placeholder")

      if isPlaceholder {
        print("[Firebase] Placeholder credentials detected – skipping Firebase initialization")
        print("[Firebase] Push notifications will NOT work until real credentials are added")
        print("[Firebase] See: credentials/README.md for setup instructions")
        shouldInitializeFirebase = false
      }
    } else {
      print("[Firebase] GoogleService-Info.plist not found – skipping Firebase initialization")
      shouldInitializeFirebase = false
    }

    if shouldInitializeFirebase {
      FirebaseApp.configure()
    }`;

// ---------------------------------------------------------------------------
// Objective-C AppDelegate replacement (kept for backward compatibility)
// ---------------------------------------------------------------------------
const OBJC_FIREBASE_SAFETY_CHECK = `${IDEMPOTENCY_MARKER}
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

// ---------------------------------------------------------------------------
// Modification functions
// ---------------------------------------------------------------------------

/**
 * Modifies a Swift AppDelegate to add Firebase safety check.
 * Replaces `FirebaseApp.configure()` with a conditional version.
 */
function modifySwiftAppDelegate(contents) {
  if (contents.includes(IDEMPOTENCY_MARKER)) {
    console.log('  [with-firebase-safety] Already modified (Swift), skipping');
    return contents;
  }

  const pattern = /FirebaseApp\.configure\(\)/;

  if (!pattern.test(contents)) {
    console.warn(
      '  [with-firebase-safety] Could not find FirebaseApp.configure() in Swift AppDelegate',
    );
    console.warn(
      '  [with-firebase-safety] Make sure this plugin is listed AFTER @react-native-firebase/app',
    );
    return contents;
  }

  const modified = contents.replace(pattern, SWIFT_FIREBASE_SAFETY_CHECK);
  console.log(
    '  [with-firebase-safety] Added Firebase placeholder credential check to Swift AppDelegate',
  );
  return modified;
}

/**
 * Modifies an Objective-C AppDelegate to add Firebase safety check.
 * Replaces `[FIRApp configure];` with a conditional version.
 */
function modifyObjcAppDelegate(contents) {
  if (contents.includes(IDEMPOTENCY_MARKER)) {
    console.log('  [with-firebase-safety] Already modified (ObjC), skipping');
    return contents;
  }

  const pattern = /\[FIRApp configure\];/;

  if (!pattern.test(contents)) {
    console.warn('  [with-firebase-safety] Could not find [FIRApp configure] in ObjC AppDelegate');
    console.warn(
      '  [with-firebase-safety] Make sure this plugin is listed AFTER @react-native-firebase/app',
    );
    return contents;
  }

  const modified = contents.replace(pattern, OBJC_FIREBASE_SAFETY_CHECK);
  console.log(
    '  [with-firebase-safety] Added Firebase placeholder credential check to ObjC AppDelegate',
  );
  return modified;
}

// ---------------------------------------------------------------------------
// Podfile modification: allow non-modular includes for Firebase pods
// ---------------------------------------------------------------------------

const PODFILE_IDEMPOTENCY_MARKER = '# @firebase-non-modular-headers-fix';

/**
 * Ruby code to inject into the Podfile's post_install block.
 * Sets CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES for
 * Firebase and RNFB pods to fix build errors when using static frameworks.
 */
const NON_MODULAR_HEADERS_FIX = `
    ${PODFILE_IDEMPOTENCY_MARKER}
    # Fix: Firebase/RNFB build errors when using static frameworks (useFrameworks: 'static')
    #
    # Problem: RNFB pods import React Native headers (RCTConvert, RCTBridgeModule, etc.) which
    # aren't properly modular. This causes two classes of errors:
    #   1. "include of non-modular header inside framework module 'RNFBApp'"
    #   2. "declaration of 'X' must be imported from module 'RNFBApp.Y' before it is required"
    #   3. "unknown type name 'RCT_EXTERN'" (macro expansion failures)
    #
    # Fix: Allow non-modular includes globally AND disable Clang modules for RNFB pods
    # so they compile as plain ObjC without module boundary enforcement.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end

      # RNFB pods need modules disabled entirely because they import React Native
      # headers that don't work with Clang's strict module import ordering
      if target.name.start_with?("RNFB")
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ENABLE_MODULES'] = 'NO'
        end
      end
    end`;

/**
 * Modifies the Podfile to add the non-modular headers fix inside the
 * existing post_install block.
 */
function modifyPodfile(podfileContents) {
  if (podfileContents.includes(PODFILE_IDEMPOTENCY_MARKER)) {
    console.log('  [with-firebase-safety] Podfile already has non-modular headers fix, skipping');
    return podfileContents;
  }

  // Find the post_install block and inject our code right after the opening
  // The Expo-generated Podfile uses: post_install do |installer|
  const postInstallPattern = /(post_install\s+do\s+\|installer\|)/;

  if (!postInstallPattern.test(podfileContents)) {
    console.warn(
      '  [with-firebase-safety] Could not find post_install block in Podfile, skipping non-modular headers fix',
    );
    return podfileContents;
  }

  const modified = podfileContents.replace(postInstallPattern, `$1${NON_MODULAR_HEADERS_FIX}`);

  console.log(
    '  [with-firebase-safety] Added CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES fix to Podfile',
  );
  return modified;
}

// ---------------------------------------------------------------------------
// Main plugin
// ---------------------------------------------------------------------------

/**
 * Applies the AppDelegate Firebase safety check modification.
 */
const withFirebaseAppDelegateSafety = config => {
  return withAppDelegate(config, config => {
    const language = config.modResults.language;

    if (language === 'swift') {
      config.modResults.contents = modifySwiftAppDelegate(config.modResults.contents);
    } else if (language === 'objcpp' || language === 'objc') {
      config.modResults.contents = modifyObjcAppDelegate(config.modResults.contents);
    } else {
      console.warn(
        `  [with-firebase-safety] Unsupported AppDelegate language "${language}", skipping modification`,
      );
    }

    return config;
  });
};

/**
 * Applies the Podfile non-modular headers fix using withDangerousMod
 * (required because there's no typed Expo mod for Podfile content).
 */
const withFirebaseNonModularHeadersFix = config => {
  return withDangerousMod(config, [
    'ios',
    config => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        console.warn('  [with-firebase-safety] Podfile not found at', podfilePath);
        return config;
      }

      const podfileContents = fs.readFileSync(podfilePath, 'utf8');
      const modified = modifyPodfile(podfileContents);

      if (modified !== podfileContents) {
        fs.writeFileSync(podfilePath, modified, 'utf8');
      }

      return config;
    },
  ]);
};

/**
 * Combined plugin: chains both modifications.
 */
const withFirebaseSafety = config => {
  config = withFirebaseAppDelegateSafety(config);
  config = withFirebaseNonModularHeadersFix(config);
  return config;
};

module.exports = withFirebaseSafety;
