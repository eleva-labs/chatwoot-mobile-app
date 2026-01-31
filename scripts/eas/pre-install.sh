#!/bin/bash

# EAS Build Pre-Install Script
# This script runs before the build process in EAS

set -e  # Exit on any error

echo "🚀 Running EAS pre-install tasks..."

# 1. Copy Google Services files
echo "📄 Step 1: Copying Google Services files..."
node scripts/eas/copy-firebase-credentials.js

echo "✅ EAS pre-install tasks completed!"

