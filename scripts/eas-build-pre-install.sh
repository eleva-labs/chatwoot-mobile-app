#!/bin/bash

# EAS Build Pre-Install Script
# This script runs before the build process in EAS
#
# Environment variables used:
#   EAS_BUILD_PLATFORM - 'android' or 'ios' (set by EAS)
#   ENVIRONMENT - 'dev' or 'prod' (set in eas.json)
#   EAS_BUILD_PROFILE - build profile name (set by EAS)
#   GOOGLE_SERVICES_JSON - path to Android Firebase file (EAS secret)
#   GOOGLE_SERVICE_INFO_PLIST - path to iOS Firebase file (EAS secret)

set -e  # Exit on any error

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 EAS Pre-Install Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Build Context:"
echo "   Platform: ${EAS_BUILD_PLATFORM:-not set}"
echo "   Environment: ${ENVIRONMENT:-not set}"
echo "   Build Profile: ${EAS_BUILD_PROFILE:-not set}"
echo ""

# 1. Copy Google Services files
echo "📄 Step 1: Setting up Firebase configuration files..."

if [ -f "scripts/copy-google-services.js" ]; then
    node scripts/copy-google-services.js
else
    echo "⚠️  Warning: scripts/copy-google-services.js not found"
    echo "   Firebase configuration may not be properly set up"
    echo "   Build will continue but may fail if Firebase is required"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ EAS pre-install tasks completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
