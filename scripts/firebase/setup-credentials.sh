#!/bin/bash

# Setup Firebase Credentials Script
# 
# Workflow:
# 1. Checks if credentials exist in environment variables (EAS cloud builds only)
# 2. Uses copy-firebase-credentials.js to process them if available
# 3. Falls back to placeholders if no real credentials found
# 
# For local development:
#   - Download files from Firebase Console
#   - Place in credentials/android/ and credentials/ios/
#   - This script will detect them and skip placeholder creation
#
# For EAS cloud builds:
#   - Credentials are injected as environment variables
#   - scripts/eas/pre-install.sh handles copying them automatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CREDENTIALS_DIR="$PROJECT_ROOT/credentials"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔧 Setting up Firebase credentials..."

# Create directory structure
mkdir -p "$CREDENTIALS_DIR/android"
mkdir -p "$CREDENTIALS_DIR/ios"

# Check if we have credentials in environment variables (from eas env:pull)
# If so, use the existing copy-firebase-credentials.js script to process them
if [ -n "$GOOGLE_SERVICES_JSON" ] || [ -n "$GOOGLE_SERVICE_INFO_PLIST" ]; then
    echo -e "${BLUE}ℹ️  Found Firebase credentials in environment, processing...${NC}"
    node "$SCRIPT_DIR/../eas/copy-firebase-credentials.js"
else
    echo -e "${YELLOW}ℹ️  No Firebase credentials found in environment variables${NC}"
fi

# Check if real credentials already exist
ANDROID_DEV_EXISTS=false
ANDROID_PROD_EXISTS=false
IOS_DEV_EXISTS=false
IOS_PROD_EXISTS=false

if [ -f "$CREDENTIALS_DIR/android/google-services-dev.json" ]; then
    # Check if it's a placeholder (contains "placeholder-project")
    if ! grep -q "placeholder-project" "$CREDENTIALS_DIR/android/google-services-dev.json" 2>/dev/null; then
        ANDROID_DEV_EXISTS=true
    fi
fi

if [ -f "$CREDENTIALS_DIR/android/google-services.json" ]; then
    if ! grep -q "placeholder-project" "$CREDENTIALS_DIR/android/google-services.json" 2>/dev/null; then
        ANDROID_PROD_EXISTS=true
    fi
fi

if [ -f "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" ]; then
    if ! grep -q "placeholder-project" "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" 2>/dev/null; then
        IOS_DEV_EXISTS=true
    fi
fi

if [ -f "$CREDENTIALS_DIR/ios/GoogleService-Info.plist" ]; then
    if ! grep -q "placeholder-project" "$CREDENTIALS_DIR/ios/GoogleService-Info.plist" 2>/dev/null; then
        IOS_PROD_EXISTS=true
    fi
fi

# Create placeholder files if real ones don't exist

# Android Development
if [ "$ANDROID_DEV_EXISTS" = false ]; then
    cat > "$CREDENTIALS_DIR/android/google-services-dev.json" << 'EOF'
{
  "project_info": {
    "project_number": "000000000000",
    "project_id": "placeholder-project",
    "storage_bucket": "placeholder-project.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:000000000000:android:0000000000000000000000",
        "android_client_info": {
          "package_name": "com.chatscommerce.app.dev"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "placeholder-api-key"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF
    echo -e "${YELLOW}📄 Created placeholder: credentials/android/google-services-dev.json${NC}"
else
    echo -e "${GREEN}✓ Real credentials found: credentials/android/google-services-dev.json${NC}"
fi

# Android Production
if [ "$ANDROID_PROD_EXISTS" = false ]; then
    cat > "$CREDENTIALS_DIR/android/google-services.json" << 'EOF'
{
  "project_info": {
    "project_number": "000000000000",
    "project_id": "placeholder-project",
    "storage_bucket": "placeholder-project.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:000000000000:android:0000000000000000000000",
        "android_client_info": {
          "package_name": "com.chatscommerce.app"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "placeholder-api-key"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF
    echo -e "${YELLOW}📄 Created placeholder: credentials/android/google-services.json${NC}"
else
    echo -e "${GREEN}✓ Real credentials found: credentials/android/google-services.json${NC}"
fi

# iOS Development
if [ "$IOS_DEV_EXISTS" = false ]; then
    cat > "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>placeholder-api-key</string>
	<key>GCM_SENDER_ID</key>
	<string>000000000000</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.chatscommerce.app.dev</string>
	<key>PROJECT_ID</key>
	<string>placeholder-project</string>
	<key>STORAGE_BUCKET</key>
	<string>placeholder-project.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false/>
	<key>IS_ANALYTICS_ENABLED</key>
	<false/>
	<key>IS_APPINVITE_ENABLED</key>
	<false/>
	<key>IS_GCM_ENABLED</key>
	<true/>
	<key>IS_SIGNIN_ENABLED</key>
	<true/>
	<key>GOOGLE_APP_ID</key>
	<string>1:000000000000:ios:0000000000000000000000</string>
</dict>
</plist>
EOF
    echo -e "${YELLOW}📄 Created placeholder: credentials/ios/GoogleService-Info-dev.plist${NC}"
else
    echo -e "${GREEN}✓ Real credentials found: credentials/ios/GoogleService-Info-dev.plist${NC}"
fi

# iOS Production
if [ "$IOS_PROD_EXISTS" = false ]; then
    cat > "$CREDENTIALS_DIR/ios/GoogleService-Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>placeholder-api-key</string>
	<key>GCM_SENDER_ID</key>
	<string>000000000000</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.chatscommerce.app</string>
	<key>PROJECT_ID</key>
	<string>placeholder-project</string>
	<key>STORAGE_BUCKET</key>
	<string>placeholder-project.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false/>
	<key>IS_ANALYTICS_ENABLED</key>
	<false/>
	<key>IS_APPINVITE_ENABLED</key>
	<false/>
	<key>IS_GCM_ENABLED</key>
	<true/>
	<key>IS_SIGNIN_ENABLED</key>
	<true/>
	<key>GOOGLE_APP_ID</key>
	<string>1:000000000000:ios:0000000000000000000000</string>
</dict>
</plist>
EOF
    echo -e "${YELLOW}📄 Created placeholder: credentials/ios/GoogleService-Info.plist${NC}"
else
    echo -e "${GREEN}✓ Real credentials found: credentials/ios/GoogleService-Info.plist${NC}"
fi

echo ""
echo "✅ Firebase credentials setup complete!"

# Show warning if using placeholders
if [ "$ANDROID_DEV_EXISTS" = false ] || [ "$IOS_DEV_EXISTS" = false ]; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  WARNING: Placeholder Firebase credentials are being used${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}✗ Push notifications will NOT work${NC}"
    echo -e "${RED}✗ Firebase Performance Monitoring will NOT work${NC}"
    echo -e "${RED}✗ Firebase Analytics will NOT work${NC}"
    echo -e "${RED}✗ App may crash on launch if Firebase is required${NC}"
    echo ""
    echo -e "${BLUE}To fix this, add real Firebase credentials using ONE of these methods:${NC}"
    echo ""
    echo -e "${GREEN}Option 1: Download from Firebase Console (Recommended for local dev)${NC}"
    echo "  1. Go to Firebase Console: https://console.firebase.google.com"
    echo "  2. Select your project (development environment)"
    echo "  3. Download the configuration files:"
    echo "     - Android: Project Settings → Your apps → Download google-services.json"
    echo "     - iOS: Project Settings → Your apps → Download GoogleService-Info.plist"
    echo "  4. Place files in credentials/ directory:"
    echo "     - credentials/android/google-services-dev.json"
    echo "     - credentials/ios/GoogleService-Info-dev.plist"
    echo "  5. Rebuild the app: task android:run (or task ios:run)"
    echo ""
    echo -e "${GREEN}Option 2: Add to EAS Secrets (For cloud builds - already configured)${NC}"
    echo "  Note: EAS cloud builds automatically use Firebase credentials from EAS Secrets."
    echo "  These are already configured for this project."
    echo "  Local development requires Option 1 (download and place files manually)."
    echo ""
    echo -e "${GREEN}Option 3: Continue with placeholders (Testing setup only)${NC}"
    echo "  - Some features will not work (push notifications, analytics, etc.)"
    echo "  - App may crash if Firebase initialization is required"
    echo "  - Only use this to test the build/setup process itself"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
fi
