# Development Guide

## Welcome to Chatscommerce Mobile Development! 🎉

This comprehensive guide covers everything you need to know about developing with our React Native mobile app, from initial setup to advanced workflows.

### Quick Start

If you're new to the project, start with the [README Quick Start](../README.md#quick-start) for a 5-minute automated setup.

---

## Prerequisites Checklist

### Required Tools

- [ ] **macOS** (iOS development requires macOS)
- [ ] **Xcode** (Download from Mac App Store - ~10GB)
- [ ] **Command Line Tools**: `xcode-select --install`
- [ ] **Homebrew**: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

### Development Tools (Auto-installed)

- [ ] **Volta** (Node version manager)
- [ ] **Node.js 20** (via Volta)
- [ ] **pnpm** (Package manager)
- [ ] **Watchman** (File watcher for Metro)

---

## Quick Start (Recommended)

### Option 1: Fully Automated Setup (5 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd chatwoot-mobile-app

# Run automated setup (installs everything)
./scripts/setup-development.sh
```

That's it! The script handles:

- ✅ Volta installation
- ✅ Node.js 20 setup
- ✅ Project dependency installation
- ✅ Development environment configuration

### Option 2: Manual Setup (10 minutes)

```bash
# 1. Install Volta
curl https://get.volta.sh | bash

# 2. Restart terminal, then setup Node
volta install node@20
volta pin node@20

# 3. Install dependencies
pnpm install

# 4. Setup development environment
task setup-dev

# 5. Verify setup
task check-prereqs
```

---

## Development Workflow

### Daily Development

```bash
# Start iOS development
task run-ios

# Start Android development
task run-android

# Check your environment
task check-prereqs

# Run tests
task test

# Clean and regenerate (use generate-soft for faster rebuilds)
task clean
task generate-soft  # or task generate for clean rebuild
```

> **Tip:** Use `task generate-soft` for incremental rebuilds or `task generate-fast` to skip pod install entirely. See Build Performance section below.

### Project Structure

```
chatwoot-mobile-app/
├── src/                    # Main application code
│   ├── screens/           # App screens
│   ├── components/        # Reusable components
│   ├── services/          # API services
│   └── store/             # State management
├── ios/                   # iOS native code
├── android/               # Android native code
├── docs/                  # Documentation
└── scripts/               # Development scripts
```

### Key Files

- **`package.json`**: Dependencies and scripts
- **`app.config.ts`**: Expo configuration
- **`eas.json`**: EAS Build configuration
- **`Taskfile.yml`**: Development tasks

---

## Environment Management

### Node Version Management with Volta

```bash
# Volta automatically manages Node versions
# When you enter the project directory, Node 20 is automatically activated

cd chatwoot-mobile-app
node --version  # Shows v20.x.x automatically
volta --version # Shows Volta version

# Pin additional tools to project
volta pin typescript@5.3.0
volta pin eslint@8.57.0

# List all pinned tools
volta list
```

### Why Volta?

- **Automatic**: No manual `nvm use` commands
- **Fast**: No shell initialization overhead
- **Team-consistent**: Everyone gets same versions
- **Project-scoped**: Versions defined in `package.json`

---

## Common Development Tasks

### Building for Development

```bash
# iOS Simulator
task run-ios

# Android Emulator
task run-android

# Web development
task run-web
```

### Testing

```bash
# Run all tests
task test

# Run tests in watch mode
task test:watch

# Run E2E tests
task test:e2e
```

### Code Quality

```bash
# Lint code
task lint

# Format code
task format

# Type check
task typecheck
```

### Build & Deploy

```bash
# Build for iOS (development)
task build-ios-dev

# Build for Android (development)
task build-android-dev

# Submit to stores
task submit-ios
task submit-android
```

---

## Troubleshooting

### Environment Issues

```bash
# Check all prerequisites
task check-prereqs

# Common issues:
# - Restart terminal after Volta installation
# - Ensure Xcode Command Line Tools are installed
# - Check Node version: node --version (should be v20.x.x)
```

### Build Issues

```bash
# Clean and regenerate native code
task clean
task generate

# Clear Metro cache
task clean-cache

# Clear all caches (Metro, iOS, ccache)
task clean-all-caches

# Reset iOS simulator
task reset-ios-simulator
```

### Dependency Issues

```bash
# Reinstall all dependencies
rm -rf node_modules
pnpm install

# Clear all caches
task clean-all
```

---

## Build Performance

This project includes build caching optimizations for faster development:

### Caching Features

| Feature | Benefit | Status |
|---------|---------|--------|
| ccache | 40-50% faster C/C++ compilation | Enabled - requires ccache install |
| EAS Build caching | 30-40% faster cloud builds | Enabled |
| expo-build-disk-cache | Near-instant rebuilds | Ready for SDK 53+ |

### Build Commands

```bash
task generate        # Clean rebuild (use after SDK changes)
task generate-soft   # Incremental (use for config changes)
task generate-fast   # Skip pod install (fastest)
```

### First-Time Setup for ccache

```bash
# Install ccache
brew install ccache

# Add to ~/.zshrc
export PATH="/opt/homebrew/opt/ccache/libexec:$PATH"

# Verify
source ~/.zshrc
ccache -s
```

### Monitoring Cache Performance

```bash
task ccache-stats     # Show ccache hit/miss statistics
task build-metrics soft ios  # Track build time
```

---

## Team Resources

### Documentation

- **[Setup Guide](docs/SETUP_IOS.md)**: Detailed environment setup
- **[Architecture](docs/architecture.md)**: System design and patterns
- **[API Docs](docs/api.md)**: Backend integration guide
- **[Testing](docs/testing.md)**: Testing strategies and tools

### Communication

- **Slack**: `#mobile-dev` for development discussions
- **GitHub Issues**: Bug reports and feature requests
- **PR Reviews**: All code changes require review

### Getting Help

1. **Check documentation first** - Most answers are in docs/
2. **Search existing issues** - Common problems are already solved
3. **Ask in Slack** - Quick questions and pair programming
4. **Create GitHub issue** - For bugs or feature requests

---

## Development Best Practices

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint + Prettier**: Automated code formatting
- **Conventional Commits**: Structured commit messages
- **Branch Naming**: `feature/`, `bugfix/`, `hotfix/` prefixes

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, then
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# Create PR for review
```

### Testing Strategy

- **Unit Tests**: All utility functions and hooks
- **Integration Tests**: API calls and navigation
- **E2E Tests**: Critical user flows
- **Manual Testing**: iOS Simulator and physical devices

---

## Advanced Setup (Optional)

### Custom Development Environment

```bash
# Use different Node version for experimentation
volta run node@18 npm install

# Install global tools
volta install typescript
volta install @expo/cli

# Custom environment variables
cp .env.example .env
# Edit .env with your settings
```

### IDE Configuration

- **VS Code**: Install recommended extensions
- **Xcode**: Use for iOS native debugging
- **Android Studio**: Use for Android native debugging

### Performance Optimization

```bash
# Enable fast refresh
# Already configured in metro.config.js

# Use Hermes engine
# Configured in app.config.ts

# Optimize bundle size
task analyze-bundle
```

---

## Success Checklist

- [ ] ✅ Environment setup complete (`task check-prereqs` passes)
- [ ] ✅ Can run iOS Simulator (`task run-ios`)
- [ ] ✅ Can run Android Emulator (`task run-android`)
- [ ] ✅ Can run tests (`task test`)
- [ ] ✅ Can build development app (`task build-ios-dev`)
- [ ] ✅ Understands project structure and workflow
- [ ] ✅ Knows where to find documentation and help

---

## Next Steps

1. **Explore the codebase** - Start with `src/App.tsx`
2. **Run the app** - See how it works on simulator
3. **Find a task** - Check GitHub issues for "good first issue"
4. **Make your first PR** - Fix a small bug or add a feature
5. **Join team standup** - Learn about current priorities

---

## Need Help?

- 📚 **Documentation**: `docs/` folder has detailed guides
- 💬 **Slack**: `#mobile-dev` channel for questions
- 🐛 **Issues**: GitHub Issues for bugs/features
- 👥 **Pair Programming**: Ask team members for guidance

**Welcome aboard! 🚀**

---

_Last updated: January 2025_
