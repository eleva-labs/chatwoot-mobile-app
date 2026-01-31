#!/bin/bash

# Setup Firebase Credentials Script
# Creates placeholder Firebase credential files for local development
# Real credentials should be obtained from Firebase Console for push notifications

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CREDENTIALS_DIR="$PROJECT_ROOT/credentials"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Setting up Firebase credentials..."

# Create directory structure
mkdir -p "$CREDENTIALS_DIR/android"
mkdir -p "$CREDENTIALS_DIR/ios"

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
    echo -e "${YELLOW}⚠️  Note: Placeholder credentials are being used.${NC}"
    echo -e "${YELLOW}   Push notifications will NOT work with placeholder credentials.${NC}"
    echo ""
    echo "To enable push notifications, replace the placeholder files with real Firebase credentials:"
    echo "  1. Go to Firebase Console: https://console.firebase.google.com"
    echo "  2. Download google-services.json (Android) and GoogleService-Info.plist (iOS)"
    echo "  3. Place them in the credentials/ directory with the appropriate names"
    echo ""
fi
