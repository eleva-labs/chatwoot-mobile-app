#!/bin/bash
# Script to run iOS app on simulator with Metro bundler
# This bypasses Expo's code signing requirements for simulator builds

set -e

# Configuration
APP_NAME="ChatscommerceDev"
BUNDLE_ID="com.chatscommerce.app.dev"
WORKSPACE_PATH="ios/${APP_NAME}.xcworkspace"
SCHEME="${APP_NAME}"
BUILD_DIR="ios/build"

# Find a booted simulator or boot iPhone 17 Pro
BOOTED_DEVICE=$(xcrun simctl list devices booted -j 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); devs=[dev['udid'] for devices in d.get('devices',{}).values() for dev in devices]; print(devs[0] if devs else '')" 2>/dev/null)

if [ -z "$BOOTED_DEVICE" ]; then
    echo "No simulator booted. Booting iPhone 17 Pro..."
    DEVICE_UDID=$(xcrun simctl list devices available -j 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); devs=[dev['udid'] for devices in d.get('devices',{}).values() for dev in devices if 'iPhone 17 Pro' == dev.get('name')]; print(devs[0] if devs else '')" 2>/dev/null)
    if [ -z "$DEVICE_UDID" ]; then
        echo "Error: iPhone 17 Pro simulator not found"
        echo "Available simulators:"
        xcrun simctl list devices available | grep -i iphone | head -5
        exit 1
    fi
    xcrun simctl boot "$DEVICE_UDID"
    BOOTED_DEVICE="$DEVICE_UDID"
fi

echo "Using simulator: $BOOTED_DEVICE"

# Open Simulator.app GUI (simctl boot only starts the daemon, not the window)
echo "Opening Simulator.app..."
open -a Simulator

# Wait for Simulator.app to be ready
sleep 2

# Start Metro bundler in background if not running
if ! lsof -i:8081 > /dev/null 2>&1; then
    echo "Starting Metro bundler..."
    pnpm run start &
    sleep 5
fi

# Build the app
echo "Building app for simulator..."
cd ios
xcodebuild \
    -workspace "${APP_NAME}.xcworkspace" \
    -scheme "${SCHEME}" \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination "id=${BOOTED_DEVICE}" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    build | tail -20

cd ..

# Find the built app (exclude Index.noindex which doesn't have proper bundle info)
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "${APP_NAME}.app" -path "*/Build/Products/Debug-iphonesimulator/*" -not -path "*Index.noindex*" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "Error: Could not find built app"
    exit 1
fi

echo "Found app at: $APP_PATH"

# Install the app
echo "Installing app on simulator..."
xcrun simctl install "$BOOTED_DEVICE" "$APP_PATH"

# Launch the app
echo "Launching app..."
xcrun simctl launch "$BOOTED_DEVICE" "$BUNDLE_ID"

echo ""
echo "App launched successfully!"
echo "Metro bundler is running on http://localhost:8081"
echo "Press Ctrl+C to stop Metro bundler"

# Keep the script running to show Metro output
wait
