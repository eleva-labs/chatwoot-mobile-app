#!/bin/bash

# Maestro Setup Script
# ===================
# Installs Maestro CLI, dependencies, and verifies setup
# Platform: macOS (with optional Linux support)

# Don't set -e immediately so we can handle command failures manually for checks
# set -e 

echo "🔧 Maestro Setup Script"
echo "======================"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Task 1: Check Java version
echo "1️⃣  Checking Java installation..."

# Try to run java -version and capture stderr (where java version usually goes)
JAVA_OUTPUT=$(java -version 2>&1 || true)

# Check if the output indicates missing runtime
if [[ "$JAVA_OUTPUT" == *"Unable to locate a Java Runtime"* ]] || [[ -z "$JAVA_OUTPUT" ]]; then
    JAVA_INSTALLED=false
else
    JAVA_INSTALLED=true
fi

if [ "$JAVA_INSTALLED" = true ]; then
    # Try to parse version. Output formats vary:
    # openjdk version "17.0.9" ...
    # java version "1.8.0_..."
    
    # Extract version string inside quotes
    JAVA_VERSION_STRING=$(echo "$JAVA_OUTPUT" | head -1 | sed -n 's/.*version "\([^"]*\)".*/\1/p')
    
    if [ -z "$JAVA_VERSION_STRING" ]; then
         echo "   ⚠️  Could not determine Java version. Output:"
         echo "$JAVA_OUTPUT"
         # Assume installed but unknown version, proceed with warning
         MAJOR_VERSION=0
    else
        echo "   ✅ Java found: $JAVA_VERSION_STRING"
        
        # Parse major version
        if [[ "$JAVA_VERSION_STRING" == 1.* ]]; then
            MAJOR_VERSION=$(echo "$JAVA_VERSION_STRING" | cut -d'.' -f2)
        else
            MAJOR_VERSION=$(echo "$JAVA_VERSION_STRING" | cut -d'.' -f1)
        fi
    fi

    # Check if Java version is 17+
    # Use 0 check to handle parse failure safely
    if [ "$MAJOR_VERSION" -gt 0 ] && [ "$MAJOR_VERSION" -lt 17 ]; then
        echo "   ⚠️  Warning: Java version is less than 17 ($MAJOR_VERSION). Some features may not work."
        echo "   💡 Install Java 17+: brew install openjdk@17"
    fi
else
    echo "   ❌ Java not found or not working."
    echo "   💡 Installing Java 17+..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew install openjdk@17
            
            # Link it so system can find it
            sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
            
            # Verify again
            if java -version &> /dev/null; then
                 echo "   ✅ Java 17 installed successfully"
            else
                 echo "   ⚠️  Java installed but 'java' command still failing. You may need to restart terminal or check PATH."
                 echo '   Try adding: export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"'
            fi
        else
             echo "   ❌ Homebrew not found. Please install Homebrew or install Java manually."
             exit 1
        fi
    else
        echo "   ⚠️  Please install Java 17+ manually for your platform"
        exit 1
    fi
fi

echo ""

# Task 2: Install Maestro CLI
echo "2️⃣  Installing Maestro CLI..."
if command_exists maestro; then
    echo "   ✅ Maestro already installed"
    MAESTRO_VERSION=$(maestro --version 2>&1 || echo "unknown")
    echo "   Version: $MAESTRO_VERSION"
else
    echo "   📥 Installing Maestro..."
    curl -fsSL "https://get.maestro.mobile.dev" | bash

    # Add Maestro to PATH for current session
    export PATH="$HOME/.maestro/bin:$PATH"

    # Add to shell profile for persistent PATH
    SHELL_PROFILE=""
    if [[ "$SHELL" == *"zsh"* ]]; then
        SHELL_PROFILE="$HOME/.zshrc"
    elif [[ "$SHELL" == *"bash"* ]]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    fi

    if [ -n "$SHELL_PROFILE" ]; then
        if ! grep -q '.maestro/bin' "$SHELL_PROFILE"; then
            echo "" >> "$SHELL_PROFILE"
            echo "# Maestro CLI" >> "$SHELL_PROFILE"
            echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> "$SHELL_PROFILE"
            echo "   ✅ Added Maestro to PATH in $SHELL_PROFILE"
            echo "   💡 Run 'source $SHELL_PROFILE' or restart your terminal"
        fi
    fi

    echo "   ✅ Maestro installed successfully"
fi

echo ""

# Task 3: Install idb-companion (macOS only, for iOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "3️⃣  Installing idb-companion (for iOS)..."
    if command_exists idb-companion; then
        echo "   ✅ idb-companion already installed"
    else
        echo "   📥 Installing idb-companion..."
        if command_exists brew; then
            brew tap facebook/fb
            brew install facebook/fb/idb-companion
            echo "   ✅ idb-companion installed successfully"
        else
             echo "   ⚠️  Homebrew not found. Skipping idb-companion."
        fi
    fi
else
    echo "3️⃣  Skipping idb-companion (macOS only)"
fi

echo ""

# Task 4: Verify installation
echo "4️⃣  Verifying Maestro installation..."
echo "   Running: maestro --version"
# Re-add to path just in case we are in same session
export PATH="$HOME/.maestro/bin:$PATH"

if maestro --version > /dev/null 2>&1; then
    echo "   ✅ Maestro version check passed"
else
    echo "   ❌ Maestro version check failed. 'maestro' command not found or failed."
    # Don't exit here, let doctor run
fi

echo ""
echo "   Running: maestro doctor"
if command_exists maestro; then
    if maestro doctor; then
        echo "   ✅ Maestro doctor check passed"
    else
        echo "   ⚠️  Maestro doctor found some issues (see above)"
        echo "   💡 You may need to resolve these issues before using Maestro"
    fi
else
    echo "   ⚠️  Skipping maestro doctor (maestro command not found)"
fi

echo ""
echo "======================"
echo "✅ Maestro setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy .env.maestro.local.example to .env.maestro.local"
echo "   2. Build iOS app: pnpm run generate && xcrun simctl install chatwootmobileapp.app"
echo "   3. Boot iOS Simulator: xcrun simctl boot 'iPhone 17 Pro' || true"
echo ""
echo "💡 Run 'pnpm maestro:test' or 'task maestro-test' to execute tests"
echo ""
