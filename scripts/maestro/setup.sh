#!/bin/bash

# Maestro Setup Script
# ===================
# Installs Maestro CLI, dependencies, and verifies setup
# Platform: macOS (with optional Linux support)

set -e  # Exit on error

echo "🔧 Maestro Setup Script"
echo "======================"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Task 1: Check Java version
echo "1️⃣  Checking Java installation..."
if command_exists java; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
    echo "   ✅ Java found: $JAVA_VERSION"

    # Check if Java version is 17+
    MAJOR_VERSION=$(echo $JAVA_VERSION | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 17 ]; then
        echo "   ⚠️  Warning: Java version is less than 17. Some features may not work."
        echo "   💡 Install Java 17+: brew install openjdk@17"
    fi
else
    echo "   ❌ Java not found"
    echo "   💡 Installing Java 17+..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install openjdk@17
        sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
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
    MAESTRO_VERSION=$(maestro --version 2>&1)
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
        brew tap facebook/fb
        brew install facebook/fb/idb-companion
        echo "   ✅ idb-companion installed successfully"
    fi
else
    echo "3️⃣  Skipping idb-companion (macOS only)"
fi

echo ""

# Task 4: Verify installation
echo "4️⃣  Verifying Maestro installation..."
echo "   Running: maestro --version"
if maestro --version; then
    echo "   ✅ Maestro version check passed"
else
    echo "   ❌ Maestro version check failed"
    exit 1
fi

echo ""
echo "   Running: maestro doctor"
if maestro doctor; then
    echo "   ✅ Maestro doctor check passed"
else
    echo "   ⚠️  Maestro doctor found some issues (see above)"
    echo "   💡 You may need to resolve these issues before using Maestro"
fi

echo ""
echo "======================"
echo "✅ Maestro setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy .env.maestro.local.example to .env.maestro.local"
echo "   2. Fill in test credentials in .env.maestro.local"
echo "   3. Run: pnpm maestro:studio (to explore)"
echo "   4. Run: task maestro-test (to run tests)"
echo ""
