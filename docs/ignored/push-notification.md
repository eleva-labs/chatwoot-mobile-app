# Push Notification System - Comprehensive Insights

## Table of Contents
1. [Overview](#overview)
2. [Dependencies and Libraries](#dependencies-and-libraries)
3. [Configuration](#configuration)
4. [Architecture and Flow](#architecture-and-flow)
5. [Device Registration](#device-registration)
6. [Notification Handling](#notification-handling)
7. [State Management](#state-management)
8. [Deep Linking Integration](#deep-linking-integration)
9. [Notification Types](#notification-types)
10. [User Preferences](#user-preferences)
11. [Platform-Specific Implementation](#platform-specific-implementation)
12. [API Endpoints](#api-endpoints)
13. [Action Cable Integration](#action-cable-integration)
14. [Key Files and Their Roles](#key-files-and-their-roles)
15. [Testing](#testing)
16. [Known Issues and Workarounds](#known-issues-and-workarounds)

---

## Overview

The Chatwoot Mobile App implements a comprehensive push notification system using Firebase Cloud Messaging (FCM) for cross-platform push notifications. The system supports:

- **Device registration** with FCM tokens
- **Real-time notification delivery** via FCM HTTP v1 API
- **Deep linking** to conversations from notifications
- **User preferences** for notification types
- **Badge count management** (iOS)
- **Background message handling**
- **Action Cable integration** for real-time notification updates

**⚠️ Important**: Firebase deprecated legacy FCM APIs on June 20, 2023, and completely shut them down on June 20, 2024. The app must use **FCM HTTP v1 API exclusively**. The backend must be configured to send notifications using the HTTP v1 API format.

---

## Dependencies and Libraries

### Core Dependencies

1. **@react-native-firebase/messaging** (`^21.7.1`)
   - Primary library for FCM integration
   - Handles token generation, permission requests, and message reception
   - Location: `package.json:49`

2. **@react-native-firebase/app** (`^21.7.1`)
   - Firebase app initialization
   - Required dependency for messaging
   - Location: `package.json:48`

3. **@notifee/react-native** (`^9.1.1`)
   - iOS-specific notification handling
   - Badge count management
   - Notification cancellation
   - **Note**: Only used on iOS platform
   - Location: `package.json:43`

### Supporting Libraries

- **react-native-device-info** (`^11.1.0`) - Device information for registration
- **react-native-permissions** (`^5.2.4`) - Permission handling
- **@react-navigation/native** - Deep linking integration

---

## Configuration

### Firebase Configuration

**File**: `firebase.json`
```json
{
  "react-native": {
    "messaging_ios_auto_register_for_remote_messages": true
  }
}
```

This enables automatic registration for remote messages on iOS.

### Expo Configuration

**File**: `app.config.ts`

#### iOS Configuration
- **Background Modes**: `['fetch', 'remote-notification']` (line 30)
- **Entitlements**: `'aps-environment': 'production'` (line 35)
- **Google Services**: Configured via `EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE` environment variable (line 34)
- **Associated Domains**: `['applinks:app.chatwoot.com']` (line 36)

#### Android Configuration
- **Google Services**: Configured via `EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE` environment variable (line 43)
- **Intent Filters**: Configured for deep linking (lines 44-67)
- **Build Properties**: 
  - `minSdkVersion: 24`
  - `compileSdkVersion: 35`
  - `targetSdkVersion: 35`
  - `enableProguardInReleaseBuilds: true`

#### Plugins
- `@react-native-firebase/app` (line 87)
- `@react-native-firebase/messaging` (line 88)
- `expo-build-properties` with Android SDK configuration (lines 89-101)

### React Native Config

**File**: `react-native.config.js`

Notifee is excluded from Android autolinking:
```javascript
'@notifee/react-native': {
  platforms: {
    android: null, // Prevents Android autolinking
  },
}
```

---

## Architecture and Flow

### High-Level Flow

1. **App Initialization**
   - User logs in
   - Device details are saved (FCM token registration)
   - Push notification preferences are fetched (Look at Chatwoot Web and how it's being set)
   - Action Cable connection established

2. **Notification Reception**
   - FCM receives notification
   - Background handler processes it (if app is backgrounded)
   - Foreground handler processes it (if app is running)
   - Notification is parsed and stored in Redux
   - Deep link is generated if applicable
   - User is navigated to conversation

3. **Notification Display**
   - System notification is shown (handled by FCM/OS)
   - Badge count is updated (iOS only)
   - In-app notification list is updated via Action Cable

### Background Message Handler

**File**: `src/navigation/index.tsx:31-33`

```typescript
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});
```

This handler processes notifications when the app is in the background or terminated.

---

## Device Registration

### Registration Process

**File**: `src/store/settings/settingsActions.ts:88-138`

The `saveDeviceDetails` action handles the complete device registration flow:

1. **Permission Check**
   ```typescript
   const permissionEnabled = await messaging().hasPermission();
   ```

2. **Android API Level 33+ Handling**
   ```typescript
   const isAndroidAPILevelGreater32 = apiLevel > 32 && Platform.OS === 'android';
   if (isAndroidAPILevelGreater32) {
     await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
   }
   ```

3. **Permission Request**
   ```typescript
   if (!permissionEnabled || permissionEnabled === -1) {
     await messaging().requestPermission();
   }
   ```

4. **Token Retrieval**
   - **Note**: There's a 1-second delay before token retrieval
   - **Reference**: https://github.com/invertase/react-native-firebase/issues/6893#issuecomment-1427998691
   - `registerDeviceForRemoteMessages()` is commented out (line 113)
   ```typescript
   const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
   await sleep(1000);
   const fcmToken = await messaging().getToken();
   ```

5. **Device Information Collection**
   - Device ID (unique identifier)
   - Device Platform (iOS/Android)
   - Device Name (manufacturer + model)
   - API Level (Android)
   - Brand Name
   - Build Number

6. **Payload Structure**
   ```typescript
   {
     subscription_type: 'fcm',
     subscription_attributes: {
       deviceName: string,
       devicePlatform: string,
       apiLevel: string,
       brandName: string,
       buildNumber: string,
       push_token: string,
       device_id: string,
     }
   }
   ```

7. **API Submission**
   - Endpoint: `POST /notification_subscriptions`
   - Service: `SettingsService.saveDeviceDetails()`

### Device Removal

**File**: `src/store/settings/settingsActions.ts:140-143`

```typescript
removeDevice: createSettingsThunk<void, { pushToken: string }>(
  'settings/removeDevice',
  ({ pushToken }) => SettingsService.removeDevice({ push_token: pushToken }),
)
```

- Endpoint: `DELETE /notification_subscriptions`
- Payload: `{ push_token: string }`

### When Registration Occurs

**File**: `src/navigation/tabs/AppTabs.tsx:86`

Device registration is triggered on app initialization:
```typescript
dispatch(settingsActions.saveDeviceDetails());
```

This happens when:
- User logs in
- App starts and user is already authenticated
- User switches accounts

---

## Notification Handling

### Notification Parsing

**File**: `src/utils/pushUtils.ts:57-69`

**⚠️ Important**: Firebase deprecated the legacy FCM APIs on June 20, 2023, and completely shut them down on June 20, 2024. Only FCM HTTP v1 API is now supported.

The system currently supports parsing both formats for backward compatibility, but **only FCM HTTP v1 format is actively supported by Firebase**:

1. **FCM HTTP v1** (Current/Required)
   ```typescript
   if (message?.data?.payload) {
     const parsedPayload = JSON.parse(message.data.payload);
     notification = parsedPayload.data.notification;
   }
   ```

2. **FCM Legacy** (Deprecated and Removed by Firebase - June 20, 2024)
   ```typescript
   else {
     notification = JSON.parse(message.data.notification);
   }
   ```
   
   **Note**: This code path should be considered for removal as Firebase no longer supports legacy format. The backend should be migrated to FCM HTTP v1 API.

### Deep Link Generation

**File**: `src/utils/pushUtils.ts:25-48`

Conversation links are generated from notifications:

```typescript
export const findConversationLinkFromPush = ({
  notification,
  installationUrl,
}: {
  notification: Notification;
  installationUrl: string;
}) => {
  const { notificationType } = notification;
  
  if (NOTIFICATION_TYPES.includes(notificationType)) {
    const { primaryActor, primaryActorId, primaryActorType } = notification;
    let conversationId = null;
    
    if (primaryActorType === 'Conversation') {
      conversationId = primaryActor.id;
    } else if (primaryActorType === 'Message') {
      conversationId = primaryActor.conversationId;
    }
    
    if (conversationId) {
      const conversationLink = `${installationUrl}/app/accounts/1/conversations/${conversationId}/${primaryActorId}/${primaryActorType}`;
      return conversationLink;
    }
  }
  return;
};
```

**Link Format**: 
```
{installationUrl}/app/accounts/{accountId}/conversations/{conversationId}/{primaryActorId}/{primaryActorType}
```

### Notification Reception Scenarios

#### 1. App Starting from Quit State

**File**: `src/navigation/index.tsx:108-136`

```typescript
async getInitialURL() {
  // Check deep link first
  const url = await Linking.getInitialURL();
  if (url != null) {
    // Handle SSO or return URL
    return url;
  }
  
  // Check for notification
  const message = await messaging().getInitialNotification();
  if (message) {
    const notification = findNotificationFromFCM({ message });
    const camelCaseNotification = transformNotification(notification);
    const conversationLink = findConversationLinkFromPush({
      notification: camelCaseNotification,
      installationUrl,
    });
    if (conversationLink) {
      return conversationLink;
    }
  }
  return undefined;
}
```

#### 2. App Running in Background

**File**: `src/navigation/index.tsx:154-168`

```typescript
const unsubscribeNotification = messaging().onNotificationOpenedApp(message => {
  if (message) {
    const notification = findNotificationFromFCM({ message });
    const camelCaseNotification = transformNotification(notification);
    const conversationLink = findConversationLinkFromPush({
      notification: camelCaseNotification,
      installationUrl,
    });
    if (conversationLink) {
      listener(conversationLink);
    }
  }
});
```

#### 3. App Running in Foreground

Foreground notifications are handled by the system, but the app can also process them through Action Cable events (see Action Cable Integration section).

---

## State Management

### Notification State

**File**: `src/store/notification/notificationSlice.ts`

#### State Structure
```typescript
interface NotificationState {
  unreadCount: number;
  totalCount: number;
  currentPage: string;
  error: string | null;
  uiFlags: {
    isLoading: boolean;
    isAllNotificationsRead: boolean;
    isAllNotificationsFetched: boolean;
  };
}
```

#### Entity Adapter
- Uses `createEntityAdapter<Notification>()` for normalized state management
- Provides efficient CRUD operations

#### Reducers

1. **addNotification** (line 49-54)
   - Adds notification to store
   - Updates unread count
   - Updates badge count (iOS)

2. **removeNotification** (line 55-60)
   - Removes notification from store
   - Updates unread count
   - Updates badge count (iOS)

3. **resetNotifications** (line 42-48)
   - Clears all notifications
   - Resets counters

#### Extra Reducers

1. **fetchNotifications** (lines 65-90)
   - Handles pagination
   - Updates badge count
   - Sets loading states

2. **markAsRead** (lines 95-109)
   - Marks notification as read
   - Decrements unread count
   - Updates badge count

3. **markAllAsRead** (lines 111-123)
   - Marks all notifications as read
   - Resets unread count to 0
   - Updates badge count

4. **markAsUnread** (lines 125-135)
   - Marks notification as unread
   - Increments unread count
   - Updates badge count

### Settings State

**File**: `src/store/settings/settingsSlice.ts`

Notification settings are stored in the settings slice:
```typescript
notificationSettings: NotificationSettings | null
```

Where `NotificationSettings` includes:
- `all_push_flags: string[]` - All available push notification types
- `selected_push_flags: string[]` - User-selected push notification types

---

## Deep Linking Integration

### Navigation Configuration

**File**: `src/navigation/index.tsx:50-175`

The navigation system is configured to handle deep links from push notifications:

#### Screen Configuration
```typescript
screens: {
  ChatScreen: {
    path: 'app/accounts/:accountId/conversations/:conversationId/:primaryActorId?/:primaryActorType?',
    parse: {
      conversationId: (conversationId: string) => parseInt(conversationId),
      primaryActorId: (primaryActorId: string) => parseInt(primaryActorId),
      primaryActorType: (primaryActorType: string) => decodeURIComponent(primaryActorType),
    },
  },
}
```

#### Link Prefixes
- Installation URL (from settings)
- SSO callback URL: `chatwootapp://auth/saml`

#### Path Processing

The `getStateFromPath` function handles:
1. SSO callback URLs (returns undefined to prevent navigation)
2. Conversation deep links (extracts conversation ID and navigates)

### Deep Link Flow

1. **Notification Received** → FCM message parsed
2. **Notification Extracted** → `findNotificationFromFCM()`
3. **Link Generated** → `findConversationLinkFromPush()`
4. **Navigation Triggered** → React Navigation handles the link
5. **Screen Opened** → ChatScreen with conversation ID

---

## Notification Types

### Supported Notification Types

**File**: `src/constants/index.ts:241-250`

```typescript
export const NOTIFICATION_TYPES = [
  'conversation_creation',
  'conversation_assignment',
  'assigned_conversation_new_message',
  'conversation_mention',
  'participating_conversation_new_message',
  'sla_missed_first_response',
  'sla_missed_next_response',
  'sla_missed_resolution',
];
```

### Notification Type Definition

**File**: `src/types/Notification.ts:4-12`

```typescript
export type NotificationType =
  | 'sla_missed_next_response'
  | 'sla_missed_first_response'
  | 'sla_missed_resolution'
  | 'conversation_creation'
  | 'conversation_assignment'
  | 'assigned_conversation_new_message'
  | 'conversation_mention'
  | 'participating_conversation_new_message';
```

### Notification Preference Types

**File**: `src/constants/index.ts:230-239`

Maps notification types to preference keys:

```typescript
export const NOTIFICATION_PREFERENCE_TYPES = {
  push_conversation_creation: 'CONVERSATION_CREATE_PUSH',
  push_conversation_assignment: 'CONVERSATION_ASSIGNEE_PUSH',
  push_assigned_conversation_new_message: 'CONVERSATION_ASSIGNED_NEW_MESSAGE_PUSH',
  push_conversation_mention: 'CONVERSATION_MENTION',
  push_participating_conversation_new_message: 'CONVERSATION_PARTICIPATING_NEW_MESSAGE_PUSH',
  push_sla_missed_first_response: 'CONVERSATION_SLA_MISSED_FIRST_RESPONSE',
  push_sla_missed_next_response: 'CONVERSATION_SLA_MISSED_NEXT_RESPONSE',
  push_sla_missed_resolution: 'CONVERSATION_SLA_MISSED_RESOLUTION',
};
```

### Notification Data Structure

**File**: `src/types/Notification.ts:16-29`

```typescript
export type Notification = {
  id: number;
  notificationType: NotificationType;
  pushMessageTitle: string;
  primaryActorType: PrimaryActorType; // 'Conversation' | 'Message'
  primaryActorId: number;
  primaryActor: PrimaryActor;
  readAt: string;
  user: User;
  snoozedUntil: string;
  createdAt: number;
  lastActivityAt: number;
  meta: object;
};
```

### Primary Actor Structure

**File**: `src/types/Notification.ts:31-41`

```typescript
export type PrimaryActor = {
  id: number;
  priority?: ConversationPriority | null;
  meta: {
    assignee: User;
    sender: User;
  };
  inboxId: number;
  additionalAttributes: ConversationAdditionalAttributes;
  conversationId: number;
};
```

---

## User Preferences

### Notification Preferences Component

**File**: `src/components-next/sheet-components/NotificationPreferences.tsx`

This component allows users to configure which notification types they want to receive.

#### Features
- Toggle switches for each notification type
- Real-time preference updates
- Separate controls for email and push notifications

#### Implementation
```typescript
const onPushItemChange = (item: string) => {
  const pushFlags = addOrRemoveItemFromArray([...selectedPushFlags], item);
  setPushFlags(pushFlags);
  savePreferences({
    emailFlags: selectedEmailFlags,
    pushFlags: pushFlags,
  });
};
```

### API Endpoints

1. **Get Notification Settings**
   - Endpoint: `GET /notification_settings`
   - Returns: `NotificationSettings` object

2. **Update Notification Settings**
   - Endpoint: `PUT /notification_settings`
   - Payload:
     ```typescript
     {
       notification_settings: {
         selected_email_flags: string[];
         selected_push_flags: string[];
       }
     }
     ```

### Preference Storage

Preferences are stored in:
- **Redux Store**: `settings.notificationSettings`
- **Backend**: Persisted via API

---

## Platform-Specific Implementation

### iOS

#### Notifee Integration

**File**: `src/utils/pushUtils.ts:5-11`

Notifee is conditionally loaded only on iOS:
```typescript
let notifee: typeof import('@notifee/react-native').default | undefined;

if (Platform.OS === 'ios') {
  notifee = require('@notifee/react-native').default;
}
```

#### Badge Count Management

**File**: `src/utils/pushUtils.ts:19-23`

```typescript
export const updateBadgeCount = async ({ count = 0 }) => {
  if (Platform.OS === 'ios' && count >= 0 && notifee) {
    await notifee.setBadgeCount(count);
  }
};
```

Badge count is updated:
- When notifications are added
- When notifications are removed
- When notifications are marked as read/unread
- When all notifications are marked as read

#### Notification Clearing

**File**: `src/utils/pushUtils.ts:13-17`

```typescript
export const clearAllDeliveredNotifications = async () => {
  if (Platform.OS === 'ios' && notifee) {
    await notifee.cancelAllNotifications();
  }
};
```

Called on app initialization (line 108 in `AppTabs.tsx`).

#### Background Modes

Configured in `app.config.ts`:
```typescript
UIBackgroundModes: ['fetch', 'remote-notification']
```

#### APNs Environment

Configured in `app.config.ts`:
```typescript
entitlements: { 'aps-environment': 'production' }
```

### Android

#### Permission Handling

**File**: `src/store/settings/settingsActions.ts:100-109`

Android API Level 33+ requires explicit POST_NOTIFICATIONS permission:
```typescript
const isAndroidAPILevelGreater32 = apiLevel > 32 && Platform.OS === 'android';

if (!permissionEnabled || permissionEnabled === -1) {
  if (isAndroidAPILevelGreater32) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  await messaging().requestPermission();
}
```

#### Build Configuration

**File**: `app.config.ts:93-98`

```typescript
android: {
  minSdkVersion: 24,
  compileSdkVersion: 35,
  targetSdkVersion: 35,
  enableProguardInReleaseBuilds: true,
}
```

#### Intent Filters

Configured for deep linking (lines 44-67 in `app.config.ts`).

---

## API Endpoints

### Device Management

1. **Save Device Details**
   - **Method**: `POST`
   - **Endpoint**: `/notification_subscriptions`
   - **Service**: `SettingsService.saveDeviceDetails()`
   - **Payload**: `PushPayload`
   - **Response**: `{ fcmToken: string }`

2. **Remove Device**
   - **Method**: `DELETE`
   - **Endpoint**: `/notification_subscriptions`
   - **Service**: `SettingsService.removeDevice()`
   - **Payload**: `{ push_token: string }`

### Notification Settings

1. **Get Notification Settings**
   - **Method**: `GET`
   - **Endpoint**: `/notification_settings`
   - **Service**: `SettingsService.getNotificationSettings()`
   - **Response**: `NotificationSettings`

2. **Update Notification Settings**
   - **Method**: `PUT`
   - **Endpoint**: `/notification_settings`
   - **Service**: `SettingsService.updateNotificationSettings()`
   - **Payload**: `NotificationSettingsPayload`
   - **Response**: `NotificationSettings`

### Notifications

1. **Get Notifications**
   - **Method**: `GET`
   - **Endpoint**: `/notifications?sort_order={sort_order}&includes[]=snoozed&includes[]=read&page={page}`
   - **Service**: `NotificationService.getNotifications()`
   - **Response**: `NotificationResponse`

2. **Mark All as Read**
   - **Method**: `POST`
   - **Endpoint**: `/notifications/read_all`
   - **Service**: `NotificationService.markAllAsRead()`

3. **Mark as Read**
   - **Method**: `POST`
   - **Endpoint**: `/notifications/read_all`
   - **Service**: `NotificationService.markAsRead()`
   - **Payload**: `{ primary_actor_id: number, primary_actor_type: string }`

4. **Mark as Unread**
   - **Method**: `POST`
   - **Endpoint**: `/notifications/{notificationId}/unread`
   - **Service**: `NotificationService.markAsUnread()`

5. **Delete Notification**
   - **Method**: `DELETE`
   - **Endpoint**: `/notifications/{notificationId}`
   - **Service**: `NotificationService.delete()`

---

## Action Cable Integration

### Real-Time Notification Updates

**File**: `src/utils/actionCable.ts`

Action Cable provides real-time notification updates when the app is running.

#### Events Handled

1. **notification.created** (line 54)
   ```typescript
   onNotificationCreated = (data: NotificationCreatedResponse) => {
     const notification: NotificationCreatedResponse = transformNotificationCreatedResponse(data);
     store.dispatch(addNotification(notification));
   };
   ```

2. **notification.deleted** (line 55)
   ```typescript
   onNotificationRemoved = (data: NotificationRemovedResponse) => {
     const notification: NotificationRemovedResponse = transformNotificationRemovedResponse(data);
     store.dispatch(removeNotification(notification));
   };
   ```

### Benefits

- **Real-time updates**: Notifications appear immediately when created/deleted
- **No polling required**: Reduces API calls
- **Consistent state**: Keeps Redux store in sync with backend
- **Badge updates**: Badge count updates automatically

### Connection

Action Cable is initialized in `AppTabs.tsx`:
```typescript
const initActionCable = useCallback(async () => {
  if (pubSubToken && webSocketUrl && accountId && userId) {
    actionCableConnector.init({ pubSubToken, webSocketUrl, accountId, userId });
  }
}, [accountId, pubSubToken, userId, webSocketUrl]);
```

---

## Key Files and Their Roles

### Core Implementation Files

1. **`src/utils/pushUtils.ts`**
   - Notification parsing from FCM
   - Deep link generation
   - Badge count management (iOS)
   - Notification clearing (iOS)

2. **`src/store/settings/settingsActions.ts`**
   - Device registration (`saveDeviceDetails`)
   - Device removal (`removeDevice`)
   - Notification settings management

3. **`src/store/settings/settingsService.ts`**
   - API calls for device management
   - API calls for notification settings

4. **`src/navigation/index.tsx`**
   - Background message handler
   - Deep linking configuration
   - Notification-to-navigation flow

5. **`src/store/notification/notificationSlice.ts`**
   - Redux state management
   - Notification CRUD operations
   - Badge count updates

6. **`src/store/notification/notificationAction.ts`**
   - Async thunks for notification operations
   - API integration

7. **`src/store/notification/notificationService.ts`**
   - Notification API calls
   - Data transformation

8. **`src/utils/actionCable.ts`**
   - Real-time notification updates
   - WebSocket event handling

### Configuration Files

1. **`app.config.ts`**
   - Expo configuration
   - Firebase plugins
   - Platform-specific settings
   - Deep linking configuration

2. **`firebase.json`**
   - Firebase-specific settings
   - iOS auto-registration

3. **`react-native.config.js`**
   - Autolinking configuration
   - Notifee exclusion for Android

### Type Definitions

1. **`src/types/Notification.ts`**
   - Notification type definitions
   - Primary actor types

2. **`src/store/settings/settingsTypes.ts`**
   - Settings-related types
   - Push payload types

3. **`src/store/notification/notificationTypes.ts`**
   - API response types
   - Action payload types

### UI Components

1. **`src/components-next/sheet-components/NotificationPreferences.tsx`**
   - User preference UI
   - Toggle switches for notification types

2. **`src/screens/inbox/components/InboxItemContainer.tsx`**
   - Notification display in inbox
   - Notification type indicators

### Constants

1. **`src/constants/index.ts`**
   - `NOTIFICATION_TYPES` array
   - `NOTIFICATION_PREFERENCE_TYPES` mapping

---

## Testing

### Test Files

1. **`src/utils/specs/pushUtils.spec.ts`**
   - Tests for `findNotificationFromFCM()`
   - Tests for `findConversationLinkFromPush()`
   - Covers both FCM HTTP v1 and legacy formats
   - Tests various notification types

### Mocks

1. **`__mocks__/@notifee/react-native.js`**
   ```javascript
   jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));
   ```

2. **`__mocks__/@react-native-firebase/messaging.js`**
   ```javascript
   jest.mock('@react-native-firebase/messaging', () => () => {
     return {
       getToken: jest.fn(() => Promise.resolve('fd79y-tiw4t-9ygv2-4fiw4-yghqw-4t79f')),
     };
   });
   ```

### Test Coverage

The test suite covers:
- FCM message parsing (both formats)
- Deep link generation for all notification types
- Edge cases (invalid notification types)
- Conversation vs Message primary actor types

---

## Known Issues and Workarounds

### 1. Token Retrieval Delay

**Issue**: FCM token may not be immediately available after permission grant.

**Workaround**: 1-second delay before token retrieval.

**Location**: `src/store/settings/settingsActions.ts:111-115`

**Reference**: https://github.com/invertase/react-native-firebase/issues/6893#issuecomment-1427998691

```typescript
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
await sleep(1000);
const fcmToken = await messaging().getToken();
```

### 2. iOS Auto-Registration

**Issue**: iOS requires explicit registration for remote messages.

**Solution**: Configured in `firebase.json`:
```json
{
  "react-native": {
    "messaging_ios_auto_register_for_remote_messages": true
  }
}
```

**Note**: `registerDeviceForRemoteMessages()` is commented out in code (line 113 of `settingsActions.ts`).

### 3. Android Autolinking

**Issue**: Notifee should not be autolinked on Android.

**Solution**: Excluded in `react-native.config.js`:
```javascript
'@notifee/react-native': {
  platforms: {
    android: null,
  },
}
```

### 4. Android API Level 33+ Permissions

**Issue**: Android 13+ requires explicit POST_NOTIFICATIONS permission.

**Solution**: Conditional permission request:
```typescript
if (isAndroidAPILevelGreater32) {
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}
```

### 5. FCM Legacy Format Support

**⚠️ Status**: **DEPRECATED AND REMOVED** - Firebase shut down legacy FCM APIs on June 20, 2024.

**Issue**: Code still contains legacy format parsing for backward compatibility, but Firebase no longer supports it.

**Current State**: The code supports both formats, but only HTTP v1 format will work:
```typescript
if (message?.data?.payload) {
  // FCM HTTP v1 (ONLY SUPPORTED FORMAT)
} else {
  // FCM Legacy (NO LONGER SUPPORTED BY FIREBASE)
}
```

**Recommendation**: 
- Backend must use FCM HTTP v1 API exclusively
- Consider removing legacy format parsing code path
- Verify backend migration to HTTP v1 API is complete
- Legacy format code can be removed once backend is confirmed migrated

**Reference**: [Firebase Migration Guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

---

## Summary

The push notification system in Chatwoot Mobile App is a comprehensive implementation that:

1. **Registers devices** with FCM and stores device information
2. **Handles notifications** in all app states (foreground, background, terminated) using **FCM HTTP v1 API**
3. **Generates deep links** to navigate users to relevant conversations
4. **Manages badge counts** on iOS
5. **Provides user preferences** for notification types
6. **Integrates with Action Cable** for real-time updates
7. **Supports both platforms** with platform-specific optimizations
8. **Handles edge cases** and known issues with workarounds

**⚠️ Critical**: The system uses FCM HTTP v1 API exclusively. Legacy FCM APIs were shut down by Firebase on June 20, 2024. The backend must be configured to send notifications using the HTTP v1 API format.

The system is well-architected with clear separation of concerns, comprehensive error handling, and extensive type safety through TypeScript.

