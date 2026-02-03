# Process Documentation Index

**Last Updated**: 2026-02-02
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Related Documentation

- **[Setup Guide](../setup/README.md)** - Environment setup and configuration
- **[README](../../README.md)** - Project overview and quick start

---

## Overview

This directory contains comprehensive process guides for developing, testing, and maintaining the Chatwoot Mobile App. All processes follow a standardized structure and are designed to ensure consistent, high-quality implementations.

---

## Process Guides

### Development

- **[Development Process](./development/development_process.md)** - Complete development workflow from request to completion
  - Study & Analysis
  - Design Document
  - Design Review
  - Execution Plan
  - Implementation & Tracking
  - Testing & Validation
  - Completion & Review

### Design & Research

- **[Research & Design Process](./design/research_and_design_process.md)** - Research phase guide before design
  - Request Understanding
  - Repository Analysis
  - Solution Exploration
  - Recommendation & Decision

### Code Review

- **[Code Review Process](./code_review/code_review_process.md)** - Systematic code review workflow
  - Commit History Analysis
  - Review Planning
  - Detailed Code Review
  - Report Generation

### Git & Pull Requests

- **[Pull Request Process](./git/git_pr_process.md)** - PR creation workflow
  - Feature PRs
  - Bug Fix/Hotfix PRs
  - Release PRs

### Testing

- **[Mobile Testing Process](./tests/mobile_testing_process.md)** - Comprehensive mobile testing guide
  - Unit Tests
  - Component Tests
  - Integration Tests
  - Manual Testing (iOS/Android)
  - Platform-Specific Testing

### Troubleshooting

- **[Troubleshooting Guide](./troubleshooting/mobile_troubleshooting.md)** - Common issues and solutions
  - Build Issues
  - Runtime Issues
  - Platform-Specific Issues
  - Performance Issues

---

## Quick Start

### New Feature Development

1. Start with **[Research & Design Process](./design/research_and_design_process.md)**
2. Create design document
3. Follow **[Development Process](./development/development_process.md)**
4. Create PR using **[Pull Request Process](./git/git_pr_process.md)**
5. Test using **[Mobile Testing Process](./tests/mobile_testing_process.md)**

### Code Review

1. Follow **[Code Review Process](./code_review/code_review_process.md)**
2. Create review plan
3. Execute detailed review
4. Generate review report

### Bug Fix

1. Follow **[Development Process](./development/development_process.md)** (simplified)
2. Test using **[Mobile Testing Process](./tests/mobile_testing_process.md)**
3. Create PR using **[Pull Request Process](./git/git_pr_process.md)**

---

## Process Templates

All processes include templates for consistent documentation:

- **Process Template**: [process_template.md](./process_template.md) - Base template for new processes
- **Design Template**: [design/DESIGN_TEMPLATE.md](./design/DESIGN_TEMPLATE.md) - Design document template
- **Execution Template**: [development/DEVELOPMENT_EXECUTION_TEMPLATE.md](./development/DEVELOPMENT_EXECUTION_TEMPLATE.md) - Execution plan template
- **Test Plan Template**: [tests/TEST_PLAN_TEMPLATE.md](./tests/TEST_PLAN_TEMPLATE.md) - Test plan template
- **Test Results Template**: [tests/TEST_RESULTS_TEMPLATE.md](./tests/TEST_RESULTS_TEMPLATE.md) - Test results template

---

## Key Principles

All processes follow these core principles:

1. **Study First** - Deep understanding before coding
2. **Design Before Implementation** - Document the plan before execution
3. **Iterative Refinement** - Collaborate to refine designs
4. **Track Progress** - Maintain execution documents
5. **Test Thoroughly** - Unit tests and manual testing on both platforms
6. **Document Everything** - Clear documentation for future reference
7. **Mobile-First** - Always test on both iOS and Android
8. **Performance Aware** - Consider mobile performance implications

---

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **Navigation**: React Navigation
- **Testing**: Jest, React Native Testing Library
- **Build**: EAS Build
- **Package Manager**: pnpm

---

## Directory Structure

```
docs/processes/
├── INDEX.md (this file)
├── process_template.md
├── code_review/
│   ├── code_review_process.md
│   ├── COMMIT_ANALYSIS_TEMPLATE.md
│   ├── REVIEW_PLAN_TEMPLATE.md
│   └── REVIEW_REPORT_TEMPLATE.md
├── design/
│   ├── research_and_design_process.md
│   ├── RESEARCH_TEMPLATE.md
│   └── DESIGN_TEMPLATE.md
├── development/
│   ├── development_process.md
│   └── DEVELOPMENT_EXECUTION_TEMPLATE.md
├── git/
│   └── git_pr_process.md
├── tests/
│   ├── mobile_testing_process.md
│   ├── TEST_PLAN_TEMPLATE.md
│   └── TEST_RESULTS_TEMPLATE.md
└── troubleshooting/
    └── mobile_troubleshooting.md
```

---

## Runtime Documents

Runtime documents (work-in-progress) are stored in `/docs/ignore/`:

- **Design Documents**: `/docs/ignore/<feature_name>/design/`
- **Execution Plans**: `/docs/ignore/<feature_name>/development/`
- **Test Plans/Results**: `/docs/ignore/tests/mobile/`
- **Code Review**: `/docs/ignore/code_review/`

These directories are gitignored and won't be committed.

---

## Related Documentation

- **[Setup Guide](../setup/README.md)** - Environment setup and configuration
  - [Prerequisites](../setup/01-prerequisites.md)
  - [Automated Setup](../setup/02-automated-setup.md)
  - [Manual Setup](../setup/03-manual-setup.md)
  - [Authentication](../setup/04-authentication.md)
  - [Firebase Credentials](../setup/05-firebase-credentials.md)
  - [Environment Variables](../setup/06-environment-variables.md)
  - [Setup Troubleshooting](../setup/07-troubleshooting.md)
- **[Project Rules](../../.cursor/rules/about.mdc)** - Development guidelines and conventions
- **[README](../../README.md)** - Project overview and quick start
- **[Expo Documentation](https://docs.expo.dev/)** - Expo framework documentation
- **[React Native Documentation](https://reactnative.dev/)** - React Native documentation

---

## Contributing

When creating new processes or updating existing ones:

1. Use the [process template](./process_template.md) as a base
2. Follow the established structure and format
3. Include examples and troubleshooting sections
4. Update this index file
5. Keep processes focused and actionable

---

## Changelog

### 2025-01-27
- Initial process documentation structure created
- Development process guide added
- Code review process guide added
- Design/research process guide added
- Git/PR process guide added
- Mobile testing process guide added
- Troubleshooting guide added

---

**End of Index**

