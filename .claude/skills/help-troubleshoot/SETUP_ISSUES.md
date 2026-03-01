# Setup Issues

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Category**: Environment Setup, Dependencies, Installation

---

## Issue: Environment Variables Not Loading

**Symptoms:** Environment variables are undefined, app configuration fails

**Cause:** `.env` file missing, not properly formatted, or Metro not restarted after changes

**Solution:**
1. Verify `.env` file exists in project root
2. Restart Metro after changes
3. Run verification:

**Commands:**
```bash
# Verify environment
task env-check

# Check .env file exists
ls -la .env
```

---

## Issue: Variables Empty in App Code

**Symptoms:** `process.env.VAR` returns undefined in application code

**Cause:** Only `EXPO_PUBLIC_*` prefixed variables are available at runtime. Other variables are only available at build time.

**Solution:**
Use the `EXPO_PUBLIC_` prefix for any variable needed in app code:

```typescript
// Works (runtime)
const url = process.env.EXPO_PUBLIC_BASE_URL;

// Won't work in app (build-time only)
const env = process.env.ENVIRONMENT;
```

**Commands:**
```bash
# Check environment variables
task env-check
```

---

## Issue: Expo CLI Version Mismatch

**Symptoms:** Expo commands fail, version incompatibility errors

**Cause:** Global Expo CLI version conflicts with project requirements

**Solution:**
Use `npx` to run Expo commands (recommended) instead of global installation:

**Commands:**
```bash
# Update Expo CLI (global - not recommended)
npm install -g expo-cli@latest

# Or use npx (recommended)
npx expo --version
```

---

## Issue: EAS Build Fails to Initialize

**Symptoms:** Cloud build fails, credentials error, project not found

**Cause:** EAS configuration issues, missing credentials, or authentication problems

**Solution:**
1. Check `eas.json` configuration
2. Verify `app.config.ts` values
3. Check credentials
4. Review build logs on Expo dashboard

**Commands:**
```bash
# Login to EAS
npx eas login

# Verify account
npx eas whoami

# Check credentials
eas credentials

# Retry setup
task setup-dev
```

---

## Issue: EAS Pull Fails

**Symptoms:** Cannot pull environment from EAS, authentication error

**Cause:** Not logged in to EAS or account mismatch

**Solution:**

**Commands:**
```bash
# Login to EAS
npx eas login

# Verify account
npx eas whoami

# Retry
task setup-dev
```

---

## Issue: Package Conflicts

**Symptoms:** Peer dependency warnings, installation fails

**Cause:** Version conflicts between packages, stale lockfile

**Solution:**

**Commands:**
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall from scratch
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for conflicts
pnpm why <package-name>
```

**Prevention:** Resolve conflicts immediately, keep dependencies updated

---

## Issue: Node Version Mismatch

**Symptoms:** Installation fails, version-specific errors

**Cause:** Wrong Node.js version for the project

**Solution:**
This project requires Node.js 20. Use Volta (recommended) or nvm:

**Commands:**
```bash
# With Volta (recommended)
volta install node@20
volta pin node@20

# With nvm
nvm install 20
nvm use 20

# Verify version
node --version  # Should show v20.x.x
```

---

## Issue: pnpm Not Installed

**Symptoms:** `pnpm: command not found`

**Cause:** pnpm package manager not installed

**Solution:**

**Commands:**
```bash
# Install pnpm via npm
npm install -g pnpm

# Or via Volta
volta install pnpm

# Verify
pnpm --version
```

---

## Related Documentation

- [COMMON_ISSUES.md](COMMON_ISSUES.md) - Issue index
- [BUILD_ISSUES.md](BUILD_ISSUES.md) - Build-related issues
- [SKILL.md](SKILL.md) - Troubleshooting overview

---

**End of Setup Issues**
