#!/bin/bash

# Firebase Credentials Download Guide
# 
# This script helps you download real Firebase credentials from the Firebase Console
# for local development. EAS builds use secret environment variables which cannot be
# pulled to local machines for security reasons.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CREDENTIALS_DIR="$PROJECT_ROOT/credentials"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║         Firebase Credentials Download Guide                      ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${YELLOW}📋 Why Do I Need This?${NC}"
echo ""
echo "Firebase credentials stored in EAS are SECRET environment variables that"
echo "can only be accessed during EAS cloud builds. For local development, you"
echo "need to download the credential files manually from the Firebase Console."
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Android Development Credentials
echo -e "${BOLD}${GREEN}Step 1: Download Android Development Credentials${NC}"
echo ""
echo -e "${CYAN}1.1${NC} Open Firebase Console:"
echo -e "     ${BLUE}https://console.firebase.google.com${NC}"
echo ""
echo -e "${CYAN}1.2${NC} Select your ${BOLD}DEVELOPMENT${NC} Firebase project"
echo -e "     (Look for a project with 'dev' or 'development' in the name)"
echo ""
echo -e "${CYAN}1.3${NC} Navigate to: ${BOLD}Project Settings${NC} (gear icon) → ${BOLD}General${NC} tab"
echo ""
echo -e "${CYAN}1.4${NC} Scroll down to ${BOLD}Your apps${NC} section"
echo ""
echo -e "${CYAN}1.5${NC} Find the Android app with package name: ${BOLD}com.chatscommerce.app.dev${NC}"
echo ""
echo -e "${CYAN}1.6${NC} Click ${BOLD}Download google-services.json${NC}"
echo ""
echo -e "${CYAN}1.7${NC} Rename the downloaded file to: ${BOLD}google-services-dev.json${NC}"
echo ""
echo -e "${CYAN}1.8${NC} Move it to: ${BOLD}$CREDENTIALS_DIR/android/${NC}"
echo ""
read -p "Press Enter when you've downloaded and placed the Android dev credentials..."
echo ""

# Verify Android dev credentials
if [ -f "$CREDENTIALS_DIR/android/google-services-dev.json" ]; then
    if ! grep -q "placeholder-project" "$CREDENTIALS_DIR/android/google-services-dev.json" 2>/dev/null; then
        echo -e "${GREEN}✓ Android development credentials found!${NC}"
    else
        echo -e "${YELLOW}⚠️  File exists but appears to be a placeholder. Make sure you downloaded the real file.${NC}"
    fi
else
    echo -e "${RED}✗ File not found. Please make sure you placed it in the correct location.${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 2: iOS Development Credentials
echo -e "${BOLD}${GREEN}Step 2: Download iOS Development Credentials${NC}"
echo ""
echo -e "${CYAN}2.1${NC} In the same Firebase project (still in ${BOLD}Your apps${NC} section)"
echo ""
echo -e "${CYAN}2.2${NC} Find the iOS app with bundle ID: ${BOLD}com.chatscommerce.app.dev${NC}"
echo ""
echo -e "${CYAN}2.3${NC} Click ${BOLD}Download GoogleService-Info.plist${NC}"
echo ""
echo -e "${CYAN}2.4${NC} Rename the downloaded file to: ${BOLD}GoogleService-Info-dev.plist${NC}"
echo ""
echo -e "${CYAN}2.5${NC} Move it to: ${BOLD}$CREDENTIALS_DIR/ios/${NC}"
echo ""
read -p "Press Enter when you've downloaded and placed the iOS dev credentials..."
echo ""

# Verify iOS dev credentials
if [ -f "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" ]; then
    if ! grep -q "placeholder-project" "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" 2>/dev/null; then
        echo -e "${GREEN}✓ iOS development credentials found!${NC}"
    else
        echo -e "${YELLOW}⚠️  File exists but appears to be a placeholder. Make sure you downloaded the real file.${NC}"
    fi
else
    echo -e "${RED}✗ File not found. Please make sure you placed it in the correct location.${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 3: Optional Production Credentials
echo -e "${BOLD}${GREEN}Step 3: (Optional) Download Production Credentials${NC}"
echo ""
echo -e "${YELLOW}Production credentials are optional for local development.${NC}"
echo -e "${YELLOW}They're only needed if you're testing production builds locally.${NC}"
echo ""
read -p "Do you want to download production credentials? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}3.1${NC} Go back to Firebase Console and select your ${BOLD}PRODUCTION${NC} project"
    echo -e "     (Look for a project with 'prod' or 'production' in the name)"
    echo ""
    echo -e "${CYAN}3.2${NC} Download Android credentials for package: ${BOLD}com.chatscommerce.app${NC}"
    echo -e "     Save as: ${BOLD}google-services.json${NC} (no '-dev' suffix)"
    echo -e "     Place in: ${BOLD}$CREDENTIALS_DIR/android/${NC}"
    echo ""
    echo -e "${CYAN}3.3${NC} Download iOS credentials for bundle: ${BOLD}com.chatscommerce.app${NC}"
    echo -e "     Save as: ${BOLD}GoogleService-Info.plist${NC} (no '-dev' suffix)"
    echo -e "     Place in: ${BOLD}$CREDENTIALS_DIR/ios/${NC}"
    echo ""
    read -p "Press Enter when done..."
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Final verification
echo -e "${BOLD}${GREEN}Verification Summary${NC}"
echo ""

ANDROID_DEV_OK=false
IOS_DEV_OK=false
ANDROID_PROD_OK=false
IOS_PROD_OK=false

if [ -f "$CREDENTIALS_DIR/android/google-services-dev.json" ] && ! grep -q "placeholder-project" "$CREDENTIALS_DIR/android/google-services-dev.json" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Android Development: ${GREEN}Ready${NC}"
    ANDROID_DEV_OK=true
else
    echo -e "${RED}✗${NC} Android Development: ${RED}Missing or placeholder${NC}"
fi

if [ -f "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" ] && ! grep -q "placeholder-project" "$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} iOS Development: ${GREEN}Ready${NC}"
    IOS_DEV_OK=true
else
    echo -e "${RED}✗${NC} iOS Development: ${RED}Missing or placeholder${NC}"
fi

if [ -f "$CREDENTIALS_DIR/android/google-services.json" ] && ! grep -q "placeholder-project" "$CREDENTIALS_DIR/android/google-services.json" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Android Production: ${GREEN}Ready${NC}"
    ANDROID_PROD_OK=true
else
    echo -e "${YELLOW}⚠${NC} Android Production: ${YELLOW}Not configured (optional)${NC}"
fi

if [ -f "$CREDENTIALS_DIR/ios/GoogleService-Info.plist" ] && ! grep -q "placeholder-project" "$CREDENTIALS_DIR/ios/GoogleService-Info.plist" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} iOS Production: ${GREEN}Ready${NC}"
    IOS_PROD_OK=true
else
    echo -e "${YELLOW}⚠${NC} iOS Production: ${YELLOW}Not configured (optional)${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Next steps
if [ "$ANDROID_DEV_OK" = true ] && [ "$IOS_DEV_OK" = true ]; then
    echo -e "${BOLD}${GREEN}🎉 All development credentials are ready!${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "  ${BOLD}1.${NC} Copy credentials to build directories:"
    echo -e "     ${BLUE}task setup:firebase${NC}"
    echo ""
    echo -e "  ${BOLD}2.${NC} Rebuild your app:"
    echo -e "     ${BLUE}task android:run${NC}  # For Android"
    echo -e "     ${BLUE}task ios:run${NC}      # For iOS"
    echo ""
    echo -e "  ${BOLD}3.${NC} Run Maestro tests:"
    echo -e "     ${BLUE}task maestro:smoke-android${NC}"
    echo -e "     ${BLUE}task maestro:smoke-ios${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Development credentials are incomplete.${NC}"
    echo ""
    echo "Please download the missing credentials from Firebase Console."
    echo "Re-run this script if you need help: ${BLUE}./scripts/firebase/download-credentials-guide.sh${NC}"
    echo ""
fi

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║                         Setup Complete!                           ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
