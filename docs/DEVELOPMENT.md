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
- [ ] **Node.js 20.19.6** (via Volta - pinned in package.json)
- [ ] **pnpm 9.0.0** (via Volta - pinned in package.json)
- [ ] **Watchman** (File watcher for Metro)
- [ ] **CocoaPods 1.16.2+** (iOS builds)

---

## Quick Start (Recommended)

### Option 1: Fully Automated Setup (5 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd chatwoot-mobile-app

# Run complete setup (base + iOS + Android + E2E)
task setup:full

# OR quick setup (dependencies + environment only)
task setup:quick
```

That's it! The setup handles:

- ✅ Volta and Node.js 20
- ✅ Development tools (Watchman, Task, pnpm)
- ✅ direnv configuration
- ✅ Environment files (.env)
- ✅ Platform-specific tools (iOS/Android)
- ✅ E2E testing setup (Maestro)

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
task setup:base

# 5. Verify setup
task setup:check-prereqs
```

---

## Development Workflow

### Daily Development

```bash
# Start iOS development
task ios:run

# Start Android development
task android:run

# Check your environment
task setup:check-prereqs

# Run tests
task quality:test

# Clean and regenerate (use generate-soft for faster rebuilds)
task ios:clean  # or task android:clean
task ios:generate-soft  # or task ios:generate for clean rebuild
```

> **Tip:** Use `task ios:generate-soft` (or `task android:generate-soft`) for incremental rebuilds. See Build Performance section below.

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
task ios:run

# Android Emulator
task android:run
```

### Testing

```bash
# Run all tests
task quality:test

# Run tests in watch mode
task quality:test-watch

# Run E2E tests
task maestro:test
```

### Code Quality

```bash
# Lint code
task quality:lint

# Format code
task quality:format

# Type check
task quality:typecheck
```

### Build & Deploy

```bash
# Build for iOS (development)
task ios:build

# Build for Android (development)
task android:build
```

---

## Troubleshooting

### Environment Issues

```bash
# Check all prerequisites
task setup:check-prereqs

# Common issues:
# - Restart terminal after Volta installation
# - Ensure Xcode Command Line Tools are installed
# - Check Node version: node --version (should be v20.x.x)
```

### Build Issues

```bash
# Clean and regenerate native code
task ios:clean  # or task android:clean
task ios:generate  # or task android:generate
```

### Dependency Issues

```bash
# Reinstall all dependencies
rm -rf node_modules
pnpm install

# Clear all caches (remove manually)
rm -rf ios android
rm -rf node_modules/.cache
```

---

## Build Performance

This project includes build caching optimizations for faster development:

### Caching Features

| Feature               | Benefit                         | Status                            |
| --------------------- | ------------------------------- | --------------------------------- |
| ccache                | 40-50% faster C/C++ compilation | Enabled - requires ccache install |
| EAS Build caching     | 30-40% faster cloud builds      | Enabled                           |
| expo-build-disk-cache | Near-instant rebuilds           | Ready for SDK 53+                 |

### Build Commands

```bash
task ios:generate        # Clean rebuild (use after SDK changes)
task ios:generate-soft   # Incremental (use for config changes)
# For Android: task android:generate, task android:generate-soft
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
task utils:ccache-stats          # Show ccache hit/miss statistics
task utils:build-metrics soft ios  # Track build time
```

---

## Team Resources

### Documentation

- **[Setup Guide](SETUP_IOS.md)**: Detailed environment setup
- **[Architecture](docs/architecture.md)**: System design and patterns

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
```

---

## Success Checklist

- [ ] ✅ Environment setup complete (`task setup:check-prereqs` passes)
- [ ] ✅ Can run iOS Simulator (`task ios:run`)
- [ ] ✅ Can run Android Emulator (`task android:run`)
- [ ] ✅ Can run tests (`task quality:test`)
- [ ] ✅ Can build development app (`task ios:build`)
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
