# Merge Context Document

## Overview
- **Source branch**: `chatwoot:develop` (upstream/develop)
- **Target branch**: `eleva-labs-development` (development)
- **Total commits being merged**: 13 from upstream/develop
- **Custom commits in development**: 35+
- **App customization**: Chatscommerce (white-label version of Chatwoot)

---

## Executive Summary

This merge brings important upstream improvements from Chatwoot (SAML SSO, MFA, audio fixes, translations) into the Chatscommerce white-label app. The development branch contains extensive customizations for branding, dark mode, environment management, and UI/UX improvements that must be preserved.

**Key Challenge**: The development branch has removed/modified many Chatwoot-specific features and added Chatscommerce branding. The merge must integrate new features while maintaining the white-label customizations.

---

## Upstream Develop Branch Additions (13 commits)

### Major Features
1. **SAML SSO Authentication** (commit 70ff347)
   - New SSO login capability
   - New `SsoUtils` utility class
   - New `SSO_CALLBACK_URL` constant
   - Deep linking support for SSO callbacks
   - `AuthButton` component for SSO login
   - Login screen modifications to show SSO button conditionally
   - Auth state management updates

2. **Multi-Factor Authentication (MFA)** (commit e6158e0)
   - New `MFAScreen` component
   - MFA verification code input with animated UI
   - Support for 6-digit OTP and hexadecimal backup codes
   - Auth flow modifications to handle MFA
   - New i18n strings for MFA
   - Navigation updates to include MFA screen

3. **Audio System Improvements** (commits c3dbe51, da2177d, 9e9bb6b)
   - Better error handling in AudioRecorder
   - Android audio format fixes
   - Mic access crash fixes
   - Audio converter utility reorganization (`audioConverter` utils)

4. **Android Permission Fix** (commit b8b43f8)
   - Removed `READ_MEDIA_IMAGES` permission to comply with Play Store requirements

5. **Translation Updates** (commits 0ce5cbf, fd11a99)
   - Updated translations for multiple languages
   - Hebrew (he.json), Portuguese (pt.json), Turkish (tr.json) updates

6. **UI Component Improvements**
   - New `UnsupportedBubble` component for unsupported message types
   - Font loading improvements (using imported font files instead of require)
   - `Record<string, never>` type improvements for empty objects

### Version Changes
- Version bumped from 4.0.x to 4.2.3
- Multiple release merges (4.2.0, 4.1.3, 4.1.2)

---

## Development Branch Additions (35+ commits)

### Branding & White-labeling
1. **Chatscommerce Branding** (commit 8c6c615, 111b5bb, d492078)
   - Complete rebranding from Chatwoot to Chatscommerce
   - Package name change: `com.chatwoot.app` → `com.chatscommerce.app`
   - App name: "Chatwoot" → "Chatscommerce" / "Chatscommerce Dev"
   - Custom app logo and splash screen
   - Custom icons (icon.png, adaptive-icon.png, with -dev variants)
   - Color scheme updates matching Chatscommerce brand

2. **Environment Management** (commits 211e0fd, 89c951c, 758d451)
   - Separate `.env` files for each environment
   - Dev and production build flavors
   - Automatic environment variable injection
   - Scripts for environment management:
     - `scripts/copy-google-services.js`
     - `scripts/pull-env.sh`
     - `scripts/copy-google-services-env.sh`
     - `scripts/fix-android-manifest.sh`
   - Environment-based configuration in `app.config.ts`

3. **Build & Deployment Configuration** (commits ff5fbf9, 95ed600, 5546679)
   - EAS configuration updates for dev/prod profiles
   - Android internal release distribution
   - `ascAppId` configuration for iOS
   - Google Services file management via EAS secrets
   - Multi-environment build scripts in package.json

### UI/UX Enhancements
1. **Dark Mode Implementation** (commit 06ec37e)
   - Complete dark mode support
   - Theme context and hooks
   - Theme-aware component styling
   - Pure black backgrounds (#000000) for OLED optimization
   - Custom dark theme for navigation

2. **Inbox UI/UX Updates** (commit 8cdaf3d)
   - Improved inbox interface
   - Better conversation list display
   - Enhanced filtering (default filter changed to "all" instead of "me")

3. **Message Alignment** (commit 6e69b15)
   - Agent messages aligned to the right (custom UX decision)

4. **AI Features** (commit f9b81b0, 178e524)
   - AI stop button added
   - AI enable icon margin fix
   - Enhanced AI conversation controls

### Feature Additions
1. **Deep Linking & Push Notifications** (commit c6816ff)
   - Comprehensive deep linking for Android
   - Push notification system enhancements
   - Multiple URL schemes support:
     - `https://app.chatscommerce.com`
     - `https://dev.app.chatscommerce.com`
     - `chatscommerce://`

2. **Build Information Display** (commit 03b59de)
   - Build info component on login screen
   - Version and environment tracking

3. **Error Boundary** (commit 0f6b89a)
   - Error boundary screen for crash handling

4. **Auto-configuration** (commit 4445f53, a5f7d22)
   - Automatic installation URL from env variables
   - Google Services file auto-configuration

### Customizations & Removals
1. **Audio Library Changes** (commit e2defbe, 79548a0)
   - Removed ffmpeg deprecated library
   - Removed audio converter library
   - Custom audio handling implementation

2. **Settings Changes** (commit 4cd1193)
   - "Chat with Us" section commented out

3. **Purpose String Updates** (commit 73961f9)
   - Custom iOS permission descriptions
   - Tailored for Chatscommerce use case

4. **Native Directories** (commit 1e63fe2, da26352)
   - iOS folder removed then re-added
   - Android & iOS native files management

---

## Conflicts Summary

### Critical Configuration Conflicts

#### 1. **app.config.ts** - COMPLEX CONFLICT
**Lines**: 86-220 (multiple conflict sections)

**Conflict Areas**:
- **App Name & Branding** (lines 86-101)
  - development: `getAppName()` → "Chatscommerce" / "Chatscommerce Dev"
  - develop: hardcoded "Chatwoot"
  
- **Slug & Scheme**
  - development: Dynamic based on env, includes custom schemes
  - develop: Fixed to "chatwoot-mobile" and "chatwootapp"

- **Version**
  - development: "4.0.21" (custom versioning)
  - develop: "4.2.3" (upstream version)

- **Bundle Identifier** (lines 134-155)
  - development: Dynamic `getBundleIdentifier()` → "com.chatscommerce.app" / ".dev"
  - develop: Fixed "com.chatwoot.app"

- **Android Permissions**
  - development: More permissions including WRITE_EXTERNAL_STORAGE, READ_MEDIA_IMAGES
  - develop: Minimal permissions (CAMERA, RECORD_AUDIO only)

- **Google Services Files**
  - development: Complex resolution with EAS env vars + credentials fallback
  - develop: Simple env variable reference

#### 2. **.env.development** - FILE NOT IN WORKSPACE
**Nature**: development branch has this file, develop doesn't
**Decision**: KEEP development version (part of multi-environment setup)

#### 3. **pnpm-lock.yaml** - DEPENDENCY CONFLICTS
**Nature**: Dependency version mismatches
**Key Differences**:
- `expo` version: 52.0.47 (develop) vs 52.0.46 (development)
- `@notifee/react-native`: Added in develop (9.1.8), removed in development
- `ffmpeg-kit-react-native`: Has patch in develop, removed in development

### Code Structure Conflicts

#### 4. **src/components-next/button/index.ts**
**Conflict**: Export statement
- development: Exports `Button` and `IconButton` only
- develop: Adds export for new `AuthButton` component

**Files Involved**: 
- New file in develop: `AuthButton.tsx` (for SSO login)

#### 5. **src/navigation/index.tsx** - MAJOR CONFLICT
**Lines**: 72-155 (multiple sections)

**Conflict Areas**:
- **Font Loading** (lines 72-90)
  - development: Uses `require()` for fonts, includes `useTheme` and `useThemedStyles`
  - develop: Imports font files as modules, cleaner approach

- **Deep Link Prefixes** (lines 113-123)
  - development: Multiple Chatscommerce URLs + scheme
  - develop: `installationUrl` + `SSO_CALLBACK_URL`

- **getStateFromPath** (lines 138-154)
  - development: Basic implementation
  - develop: Adds SSO callback handling with `SsoUtils`

**Dependencies**: Requires `SsoUtils` from develop branch

#### 6. **src/screens/auth/LoginScreen.tsx** - CRITICAL CONFLICT
**Lines**: Multiple conflict sections (39-47, 165-216, 259-265)

**Conflict Areas**:
- **Imports** (lines 39-47)
  - development: Imports theme context, settings actions, app logo
  - develop: Imports `SsoUtils` for SSO

- **SSO Login UI** (lines 165-247)
  - development: No SSO UI (commented out title/description)
  - develop: Complete SSO button and divider UI with `handleSsoLogin` function

- **Form Spacing & Styling**
  - development: Custom dark mode styling, different spacing
  - develop: Standard styling, MFA-aware submission

**Key Features in develop**:
- `handleSsoLogin()` function
- SSO button display based on `installationUrl`
- MFA navigation on login response

### Audio System Conflicts

#### 7. **src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx**
**Lines**: 23-28

**Conflict**: Import path for audio converter
- development: `import { convertAacToWav } from '@/utils'`
- develop: `import { convertAacToWav } from '@/utils/audioConverter'`

**Note**: develop has better organization with dedicated audioConverter file

#### 8. **src/screens/chat-screen/components/message-components/AudioBubble.tsx**
**Lines**: 21-26

**Conflict**: Same as AudioRecorder - import path
- development: `import { convertOggToWav } from '@/utils'`
- develop: `import { convertOggToWav } from '@/utils/audioConverter'`

#### 9. **src/screens/chat-screen/components/message-components/index.ts**
**Lines**: 24-27

**Conflict**: Component exports
- development: No `UnsupportedBubble` export
- develop: Adds `export * from './UnsupportedBubble'`

**Files Involved**: New `UnsupportedBubble.tsx` in develop

### Message Display Conflicts

#### 10. **src/screens/chat-screen/components/message-item/Message.tsx**
**Lines**: Import of `UnsupportedBubble`

**Conflict**: Component usage
- development: No `UnsupportedBubble` in imports or usage
- develop: Imports and uses `UnsupportedBubble` for unsupported message types

#### 11. **src/screens/chat-screen/components/reply-box/ReplyBoxContainer.tsx**
**Lines**: 27-33

**Conflict**: Import and constant
- development: Imports `useThemedStyles`, includes `AUDIO_FORMATS` constant
- develop: No `useThemedStyles`, no `AUDIO_FORMATS` constant

**Note**: development has audio format customization removed

### Conversation UI Conflicts

#### 12. **src/screens/conversations/components/conversation-item/ConversationAvatar.tsx**
**Lines**: 15-18, 27-41

**Conflict**: Props and component usage
- development: Has `unreadCount` prop, passes it to Avatar as counter
- develop: No `unreadCount` prop

**Feature**: development branch shows unread count on avatar

#### 13. **src/screens/conversations/components/conversation-item/ConversationItem.tsx**
**Lines**: 50-54

**Conflict**: Type definition
- development: `| object` for appliedSlaConversationDetails
- develop: `| Record<string, never>` (more type-safe)

#### 14. **src/screens/conversations/components/conversation-item/ConversationItemDetail.tsx**
**Lines**: 45-49

**Conflict**: Same type definition issue as ConversationItem.tsx

### Utility Conflicts

#### 15. **src/utils/pushUtils.ts**
**Lines**: 8-15

**Conflict**: Notifee library usage
- development: Commented out notifee (removed library)
- develop: Actively uses notifee for iOS notifications

**Impact**: iOS notification badge management differs

### Translation Conflicts

#### 16. **src/i18n/he.json** - Hebrew translations
**Nature**: Translation updates vs. customization
- development: May have Chatscommerce-specific strings
- develop: Updated Hebrew translations

#### 17. **src/i18n/pt.json** - Portuguese translations
**Nature**: Same as Hebrew - updated translations in develop

#### 18. **src/i18n/tr.json** - Turkish translations
**Nature**: Same as above - updated translations in develop

---

## Conflict Resolution Decisions

### 1. Configuration Files

#### app.config.ts
**Decision**: KEEP DEVELOPMENT BASE, MERGE FEATURES
**Rationale**: 
- Development has critical white-label infrastructure
- Environment-based configuration is production requirement
- SSO support can be integrated into existing structure

**Actions**:
- Keep development's dynamic configuration functions
- Keep Chatscommerce branding (name, bundle ID, schemes)
- Keep development version strategy (4.0.x series)
- Keep development's permission set
- Add SSO_CALLBACK_URL to prefixes array (merge approach)
- Maintain environment-based Google Services file resolution

**Trade-offs**: 
- Not using upstream version 4.2.3
- Need to manually integrate SSO URL handling

#### .env.development
**Decision**: KEEP DEVELOPMENT
**Rationale**: Part of multi-environment setup, not in upstream

#### pnpm-lock.yaml
**Decision**: REGENERATE AFTER MANUAL MERGE
**Rationale**: 
- Lock file conflicts should be resolved by reinstalling
- Dependencies need to align with chosen features

**Actions**:
- If keeping notifee: Add back to package.json
- If keeping ffmpeg-kit: Ensure patch is applied
- Run `pnpm install` after merge to regenerate

### 2. Authentication & Security

#### src/screens/auth/LoginScreen.tsx
**Decision**: MERGE BOTH - COMPLEX INTEGRATION
**Rationale**: 
- SSO is valuable new feature
- MFA support needed for enterprise
- Dark mode styling must be preserved
- Auto-configuration must work

**Actions**:
- Import `SsoUtils` from develop
- Add `handleSsoLogin` function from develop
- Keep development's theme-aware styling variables
- Keep development's auto-installation URL logic
- Integrate MFA navigation from develop
- Conditionally show SSO button (develop logic)
- Keep development's custom logo import
- Merge SSO UI section (button + divider)

**Implementation Notes**:
```typescript
// Keep from development
const { isDark } = useTheme();
const themedTailwind = useThemedStyles();
const backgroundColor = isDark ? 'bg-grayDark-50' : 'bg-white';
// ... other theme variables

// Add from develop
import { SsoUtils } from '@/utils/ssoUtils';
const handleSsoLogin = async () => { /* ... */ };
const showSsoLogin = installationUrl.includes('app.chatwoot.com'); // Or chatscommerce.com

// Merge SSO UI before email input
{showSsoLogin && (
  <View>
    <AuthButton ... />
    <View style={...} /* OR divider */ />
  </View>
)}
```

#### src/navigation/index.tsx
**Decision**: MERGE BOTH - KEEP DEVELOPMENT BASE + ADD SSO
**Rationale**:
- Development's font loading with theme support is working
- SSO callback handling is necessary
- Deep linking prefixes must include both Chatscommerce and SSO

**Actions**:
- Keep development's font loading approach
- Keep `useTheme` and `useThemedStyles` imports
- Merge deep link prefixes (both Chatscommerce URLs and SSO_CALLBACK_URL)
- Add SSO callback handling in `getStateFromPath`, `getInitialURL`, and `subscribe`
- Import and use `SsoUtils` from develop

**Implementation Notes**:
```typescript
const linking = {
  prefixes: [
    installationUrl,
    'https://app.chatscommerce.com',
    'https://dev.app.chatscommerce.com',
    'chatscommerce://',
    SSO_CALLBACK_URL, // Add from develop
  ],
  // ... in getStateFromPath:
  getStateFromPath: (path: string, config: any) => {
    // Add SSO handling from develop
    if (path.includes(SSO_CALLBACK_URL) || path.includes('auth/saml')) {
      const ssoParams = SsoUtils.parseCallbackUrl(`chatwootapp://${path}`);
      SsoUtils.handleSsoCallback(ssoParams, dispatch);
      return undefined;
    }
    // ... rest of development logic
  },
  // Similar additions in getInitialURL and subscribe
}
```

#### New Files from develop to ADD:
- `src/utils/ssoUtils.ts` - REQUIRED for SSO
- `src/screens/auth/MFAScreen.tsx` - REQUIRED for MFA
- `src/components-next/button/AuthButton.tsx` - REQUIRED for SSO UI
- `src/components-next/verification-code/*` - REQUIRED for MFA UI

#### Auth State Management
**Decision**: MERGE develop changes
**Files**: 
- `src/store/auth/authActions.ts`
- `src/store/auth/authSlice.ts`
- `src/store/auth/authTypes.ts`
- `src/store/auth/authUtils.ts`
- `src/store/auth/authSelectors.ts`
- `src/store/auth/authService.ts`

**Rationale**: MFA and SSO require auth state updates

### 3. Audio System

#### AudioRecorder.tsx & AudioBubble.tsx
**Decision**: USE DEVELOP's IMPORT PATH
**Rationale**: Better code organization

**Actions**:
- Change imports to use `@/utils/audioConverter`
- Ensure `audioConverter.ts` utility exists (from develop)
- If development removed audio converter, need to re-add or verify functionality

**Check Required**: 
- Does development branch have `src/utils/audioConverter.ts`?
- If not, add from develop
- If development removed ffmpeg, verify audio conversion still works

#### Audio Format Constants
**Decision**: INVESTIGATE THEN DECIDE
**Rationale**: development removed `AUDIO_FORMATS` constant

**Actions**:
- Check if `AUDIO_FORMATS` is used in ReplyBoxContainer
- If not used, remove from develop merge
- If used, understand why development removed it

### 4. Message Components

#### UnsupportedBubble
**Decision**: ADD FROM DEVELOP
**Rationale**: 
- Better UX for unsupported message types
- No conflict with existing functionality
- Small, self-contained component

**Actions**:
- Copy `src/screens/chat-screen/components/message-components/UnsupportedBubble.tsx`
- Add export to `index.ts`
- Add import and usage in `Message.tsx`

#### Message.tsx
**Decision**: MERGE - Add UnsupportedBubble handling
**Actions**:
- Import `UnsupportedBubble`
- Add rendering logic for unsupported messages
- Keep all development customizations

### 5. Conversation UI

#### ConversationAvatar & Unread Counter
**Decision**: KEEP DEVELOPMENT VERSION
**Rationale**: 
- Unread count on avatar is a valuable UX feature
- Custom implementation in development
- No conflict with develop's changes

**Actions**:
- Keep `unreadCount` prop
- Keep counter display on Avatar

#### Type Definitions (appliedSlaConversationDetails)
**Decision**: USE DEVELOP's TYPE
**Rationale**: `Record<string, never>` is more type-safe than `object`

**Actions**:
- Replace `| object` with `| Record<string, never>` in:
  - `ConversationItem.tsx`
  - `ConversationItemDetail.tsx`

### 6. Utilities & Libraries

#### src/utils/pushUtils.ts
**Decision**: EVALUATE THEN DECIDE - FLAGGED FOR REVIEW ⚠️
**Rationale**: 
- development removed notifee (intentional dependency removal)
- develop uses notifee for iOS badge management
- Need to understand if badge counting is still needed

**Options**:
1. **Keep development (no notifee)**: If badge management not required
2. **Re-add notifee**: If iOS badge counting is important
3. **Alternative solution**: Use expo-notifications for badges

**⚠️ NEEDS HUMAN REVIEW**: 
- Is iOS badge count management important for Chatscommerce?
- Was notifee removed due to compatibility issues or intentional feature removal?
- Check if expo-notifications can handle badges

#### src/components-next/button/index.ts
**Decision**: MERGE - Add AuthButton export
**Actions**: 
- Add `export * from './AuthButton'`
- Ensure AuthButton.tsx is copied from develop

#### src/components-next/common/index.ts
**Decision**: UPDATE - Export verification code components
**Actions**: 
- Add exports for MFA verification components if not present

### 7. Translations

#### he.json, pt.json, tr.json
**Decision**: USE DEVELOP TRANSLATIONS, REVIEW FOR BRANDING
**Rationale**: 
- Crowdin translation updates should be integrated
- Need to verify no "Chatwoot" text conflicts with "Chatscommerce" branding

**Actions**:
- Accept develop's translations
- Post-merge: Search for "Chatwoot" strings in all i18n files
- Replace with "Chatscommerce" where appropriate
- Add task to review all translations for branding consistency

#### All other i18n files
**Decision**: ACCEPT DEVELOP (auto-merged)
**Rationale**: Translation updates, no conflicts

### 8. Dependencies & Build

#### package.json
**Decision**: CAREFUL MERGE
**Rationale**: 
- development has custom scripts infrastructure
- develop may have new dependency versions

**Actions**:
- Keep all development's custom scripts (env:pull, android:dev/prod, etc.)
- Keep development's version (4.0.x)
- Check for new dependencies in develop:
  - If SSO-related: Add
  - If MFA-related: Add
  - If notifee: Decision pending (see pushUtils)
- Merge any new dependencies needed for new features

**Review Required**:
- Check develop's package.json for new deps
- Verify no breaking dependency updates

### 9. Navigation & Routing

#### src/navigation/stack/AuthStack.tsx
**Decision**: MERGE - Add MFA screen route
**Actions**:
- Add `MFAScreen` route definition
- Keep all development customizations

---

## Implementation Strategy

### Phase 1: Preparation
1. ✅ Document all conflicts (this file)
2. Create feature branch from development: `git checkout -b merge/upstream-develop-4.2`
3. Back up critical files:
   - app.config.ts
   - package.json
   - LoginScreen.tsx
   - navigation/index.tsx

### Phase 2: Add New Files First
Add new files from develop before merging conflicts:
1. `src/utils/ssoUtils.ts`
2. `src/utils/audioConverter.ts` (if missing)
3. `src/screens/auth/MFAScreen.tsx`
4. `src/components-next/button/AuthButton.tsx`
5. `src/components-next/verification-code/*` (all files)
6. `src/screens/chat-screen/components/message-components/UnsupportedBubble.tsx`

### Phase 3: Resolve Conflicts Systematically
Resolve in this order (dependencies first):

1. **Utilities** (no dependencies on other files)
   - audioConverter imports (AudioRecorder, AudioBubble)
   - pushUtils (after notifee decision)

2. **Type definitions** (low risk)
   - ConversationItem.tsx (`Record<string, never>`)
   - ConversationItemDetail.tsx (`Record<string, never>`)

3. **Component exports** (low risk)
   - button/index.ts (add AuthButton)
   - message-components/index.ts (add UnsupportedBubble)

4. **Message components** (medium risk)
   - Message.tsx (add UnsupportedBubble usage)

5. **Navigation** (high risk - many dependencies)
   - navigation/index.tsx (complex merge)
   - navigation/stack/AuthStack.tsx (add MFA route)

6. **Authentication** (highest risk)
   - LoginScreen.tsx (complex merge with SSO + theme + MFA)
   - Auth store files (actions, slice, types, etc.)

7. **Configuration** (critical)
   - app.config.ts (careful merge)
   - package.json (merge scripts and dependencies)

8. **Translations** (low risk, post-review needed)
   - he.json, pt.json, tr.json

9. **Lock files** (regenerate)
   - pnpm-lock.yaml (delete and regenerate)

### Phase 4: Post-Merge Tasks
1. Delete and regenerate pnpm-lock.yaml:
   ```bash
   rm pnpm-lock.yaml
   pnpm install
   ```

2. Run linter:
   ```bash
   pnpm lint
   ```

3. Test build for both environments:
   ```bash
   pnpm android:dev
   pnpm ios:dev
   ```

4. Search for branding issues:
   ```bash
   grep -r "Chatwoot" src/i18n/
   grep -r "chatwoot" src/i18n/ -i
   ```

5. Manual testing checklist:
   - [ ] Login works (standard auth)
   - [ ] SSO login appears and works (if enabled)
   - [ ] MFA flow works (if user has MFA)
   - [ ] Dark mode toggle works
   - [ ] Audio messages work
   - [ ] Deep linking works (all schemes)
   - [ ] Push notifications work
   - [ ] Conversations load and display
   - [ ] Messages send successfully
   - [ ] Unread counters display
   - [ ] Environment switching works (dev/prod)

### Phase 5: Verification
1. Code review focusing on:
   - SSO integration completeness
   - MFA integration completeness
   - Audio system functionality
   - Theme consistency
   - Branding consistency

2. Update version:
   - Decide on version number (4.0.22? 4.1.0? 4.2.0-chatscommerce?)

3. Update changelog

---

## ⚠️ Needs Human Review

### Critical Decision Points

#### 1. Notifee Library (iOS Badge Management)
**File**: `src/utils/pushUtils.ts`

**Question**: Should we re-add `@notifee/react-native`?

**Context**:
- development branch intentionally removed notifee
- develop branch uses it for iOS badge count management
- Alternative: expo-notifications

**Investigation Needed**:
- Why was notifee removed in development?
- Is iOS badge counting important for users?
- Any compatibility issues with notifee?

**Recommendation Needed**: Yes/No on notifee + implementation approach

#### 2. Audio Converter/FFmpeg
**Files**: AudioRecorder, AudioBubble, utils

**Question**: Audio conversion strategy?

**Context**:
- development removed ffmpeg library (deprecated)
- develop has `audioConverter` utility
- May impact audio message playback

**Investigation Needed**:
- Does current development audio system work without ffmpeg?
- What audio formats need to be supported?
- Test audio on both iOS and Android

**Recommendation Needed**: Audio conversion approach

#### 3. Version Numbering Strategy
**File**: `app.config.ts`, `package.json`

**Question**: What version should merged app be?

**Options**:
- 4.0.22 (continue development series)
- 4.1.0 (minor bump for new features)
- 4.2.0-chatscommerce (align with upstream, add suffix)
- 4.2.3-chatscommerce (match upstream exactly, add suffix)

**Recommendation Needed**: Version strategy going forward

#### 4. SSO URL Check
**File**: `LoginScreen.tsx`

**Current Logic**: `installationUrl.includes('app.chatwoot.com')`

**Question**: Should SSO button show for Chatscommerce?

**Context**:
- Current check looks for chatwoot.com domain
- Chatscommerce uses app.chatscommerce.com / dev.app.chatscommerce.com
- May need backend SSO configuration first

**Options**:
1. Change to `installationUrl.includes('app.chatscommerce.com')`
2. Use environment variable flag
3. Keep chatwoot.com check (SSO disabled for now)

**Recommendation Needed**: SSO availability strategy

#### 5. Android Permissions
**File**: `app.config.ts`

**Question**: Which permission set to use?

**Context**:
- development has more permissions (WRITE_EXTERNAL_STORAGE, READ_MEDIA_IMAGES)
- develop removed READ_MEDIA_IMAGES to comply with Play Store
- develop has minimal set (CAMERA, RECORD_AUDIO)

**Concern**: Play Store compliance vs. feature functionality

**Investigation Needed**:
- Are all development permissions actually used?
- Will removal of READ_MEDIA_IMAGES break features?
- Test media gallery access on Android

**Recommendation Needed**: Final permission set

#### 6. Translation Branding
**Files**: All i18n/*.json files

**Question**: Review all translations for Chatwoot references?

**Context**:
- Upstream translations may have "Chatwoot" in strings
- Need comprehensive review
- Some strings intentionally white-labeled in development

**Options**:
1. Automated search/replace (risky)
2. Manual review of each string
3. Tool-assisted review with human approval

**Recommendation Needed**: Translation review process

---

## Testing Checklist

### Pre-Merge Testing (Current Development)
- [ ] Document current audio functionality
- [ ] Document current notification behavior
- [ ] Document all custom features
- [ ] Test dark mode thoroughly
- [ ] Test deep linking
- [ ] Test push notifications

### Post-Merge Testing

#### Authentication
- [ ] Standard login (email/password)
- [ ] Forgot password flow
- [ ] Auto-installation URL works
- [ ] MFA flow (if enabled on account)
- [ ] SSO flow (if enabled)
- [ ] Logout and re-login

#### Core Features
- [ ] View conversations list
- [ ] Open conversation
- [ ] Send text message
- [ ] Send image
- [ ] Send file
- [ ] Record and send audio message
- [ ] Play received audio message
- [ ] Reply to message
- [ ] Use canned response

#### UI/UX
- [ ] Dark mode toggle
- [ ] Light mode appearance
- [ ] Dark mode appearance (pure black backgrounds)
- [ ] Avatar displays correctly
- [ ] Unread counters display
- [ ] Typing indicators work
- [ ] Message timestamps
- [ ] Message delivery status

#### Conversation Management
- [ ] Filter conversations (all, me, unassigned)
- [ ] Search conversations
- [ ] Assign conversation
- [ ] Change status
- [ ] Add/remove labels
- [ ] Priority indicators display
- [ ] SLA indicators display (if applicable)

#### Deep Linking
- [ ] Open from push notification
- [ ] Open from web link (https://app.chatscommerce.com/app/accounts/...)
- [ ] Open from web link (https://dev.app.chatscommerce.com/app/accounts/...)
- [ ] Open from custom scheme (chatscommerce://...)
- [ ] SSO callback handling (if enabled)

#### Platform-Specific
- [ ] iOS: Push notifications
- [ ] iOS: Badge count (if notifee kept)
- [ ] iOS: Audio playback
- [ ] iOS: Deep linking
- [ ] iOS: Build successful
- [ ] Android: Push notifications
- [ ] Android: Audio playback
- [ ] Android: Deep linking
- [ ] Android: Notification channels
- [ ] Android: Build successful

#### Build & Deploy
- [ ] Dev build works (android:dev, ios:dev)
- [ ] Prod build works (android:prod, ios:prod)
- [ ] EAS build successful (dev profile)
- [ ] EAS build successful (prod profile)
- [ ] Environment variables load correctly
- [ ] Google Services files resolve correctly

---

## Risk Assessment

### High Risk Areas
1. **Authentication Flow** - SSO and MFA integration is complex
2. **Deep Linking** - Multiple URL schemes and callback handling
3. **Audio System** - Library changes may affect playback
4. **Build Configuration** - Environment management is custom

### Medium Risk Areas
1. **Notifications** - iOS badge counting dependency decision
2. **Theme System** - Merge of styling approaches
3. **Navigation** - Complex state management

### Low Risk Areas
1. **Translations** - Mostly additive
2. **Type definitions** - Minor improvements
3. **New components** - Self-contained

---

## Success Criteria

Merge is successful when:
1. ✅ App builds for both dev and prod environments
2. ✅ All core features work (send/receive messages)
3. ✅ Authentication works (including MFA if enabled)
4. ✅ Dark mode works correctly
5. ✅ Deep linking works for all schemes
6. ✅ Push notifications work
7. ✅ No branding leaks ("Chatwoot" visible to users)
8. ✅ Audio messages work
9. ✅ All tests pass
10. ✅ Linter passes with no errors
11. ✅ Both iOS and Android builds successful
12. ✅ Manual QA checklist complete

---

## Rollback Plan

If merge introduces critical issues:

1. **Immediate Rollback**:
   ```bash
   git reset --hard HEAD~1  # If commit made
   git merge --abort         # If merge in progress
   ```

2. **Partial Rollback** (revert specific features):
   - Create branch from development
   - Cherry-pick successful commits
   - Skip problematic commits

3. **Feature Flags** (for next attempt):
   - Add feature flags for SSO
   - Add feature flags for MFA
   - Add feature flags for notifee
   - Allow gradual rollout

---

## Notes for Next Merge

### Process Improvements
1. Consider feature flags for large upstream features
2. Set up automated branding checks (CI check for "Chatwoot" strings)
3. Create merge automation scripts for common patterns
4. Document white-labeling strategy more formally

### Recurring Conflicts
- Font loading approach
- Theme/styling approach
- Branding strings
- Environment configuration
- Google Services file paths

### Potential Future Conflicts
- More authentication methods (OAuth providers)
- More white-label configuration
- More environment-specific features
- Upstream dependency updates

---

## Developer Notes

### Key Files Modified in Development (Don't Overwrite)
- `app.config.ts` - White-label configuration
- `.env.*` files - Environment management
- `package.json` - Custom scripts
- Any file with "Chatscommerce" branding
- Theme files (if customized beyond dark mode)

### Key Files to Always Merge from Upstream
- Translation files (src/i18n/*.json)
- Security fixes
- Bug fixes
- Type definition improvements

### Merge Command for Next Time
```bash
# Fetch latest
git fetch origin
git fetch upstream

# Create merge branch
git checkout development
git checkout -b merge/upstream-develop-4.x

# Start merge
git merge upstream/develop --no-commit --no-ff

# Follow resolution strategy in this document
# ...

# After resolving all conflicts
pnpm install
pnpm lint
# Test builds
# Commit
git commit -m "Merge upstream develop (v4.2.x) into development

Integrated features:
- SAML SSO authentication
- Multi-factor authentication (MFA)
- Audio system improvements
- Translation updates
- Bug fixes

Preserved customizations:
- Chatscommerce branding
- Dark mode implementation
- Environment management
- Custom UI/UX
- Deep linking
- Build configuration

See MergeContext.md for detailed resolution decisions."
```

---

## Appendix: File-by-File Resolution Map

| File Path | Conflict Type | Resolution | Priority |
|-----------|---------------|------------|----------|
| .env.development | New file | KEEP | High |
| app.config.ts | Complex merge | KEEP BASE + MERGE | Critical |
| package.json | Scripts + deps | MERGE | High |
| pnpm-lock.yaml | Regenerate | REGENERATE | High |
| src/components-next/button/index.ts | Export | ADD | Low |
| src/i18n/he.json | Translation | DEVELOP + review | Low |
| src/i18n/pt.json | Translation | DEVELOP + review | Low |
| src/i18n/tr.json | Translation | DEVELOP + review | Low |
| src/navigation/index.tsx | Complex merge | KEEP BASE + MERGE SSO | Critical |
| src/screens/auth/LoginScreen.tsx | Complex merge | KEEP BASE + MERGE SSO/MFA | Critical |
| src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx | Import path | USE DEVELOP | Medium |
| src/screens/chat-screen/components/message-components/AudioBubble.tsx | Import path | USE DEVELOP | Medium |
| src/screens/chat-screen/components/message-components/index.ts | Export | ADD | Low |
| src/screens/chat-screen/components/message-item/Message.tsx | Import + usage | ADD | Medium |
| src/screens/chat-screen/components/reply-box/ReplyBoxContainer.tsx | Import | INVESTIGATE | Medium |
| src/screens/conversations/components/conversation-item/ConversationAvatar.tsx | Props | KEEP DEVELOPMENT | Low |
| src/screens/conversations/components/conversation-item/ConversationItem.tsx | Type | USE DEVELOP TYPE | Low |
| src/screens/conversations/components/conversation-item/ConversationItemDetail.tsx | Type | USE DEVELOP TYPE | Low |
| src/utils/pushUtils.ts | Library usage | NEEDS REVIEW | High |

---

## Document Metadata
- **Created**: 2025-01-13
- **Author**: AI Assistant (Claude)
- **Purpose**: Guide merge of chatwoot:develop into eleva-labs-development
- **Status**: Ready for Review
- **Last Updated**: 2025-01-13

---

*This document should be reviewed and approved by the development team before proceeding with the merge. All decisions marked ⚠️ NEEDS HUMAN REVIEW must be resolved before merge execution.*

