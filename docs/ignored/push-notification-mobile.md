# Mobile Push Notification System - Clean Architecture

## Table of Contents
1. [Overview](#overview)
2. [Clean Architecture Layers](#clean-architecture-layers)
3. [Domain Layer](#domain-layer)
4. [Data Layer](#data-layer)
5. [Infrastructure Layer](#infrastructure-layer)
6. [Presentation Layer](#presentation-layer)
7. [Cross-Cutting Concerns](#cross-cutting-concerns)
8. [Data Flow](#data-flow)
9. [Key Files Reference](#key-files-reference)
10. [Testing Strategy](#testing-strategy)

---

## Overview

This document describes the **mobile client-side** push notification system in the Chatwoot Mobile App, organized according to **Clean Architecture** principles.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  (UI Components, Navigation, State Management)          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Domain Layer                          │
│  (Entities, Use Cases, Business Logic)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Data Layer                             │
│  (Repositories, Data Sources, Models)                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Infrastructure Layer                        │
│  (FCM SDK, Notifee, API Client, Platform APIs)           │
└─────────────────────────────────────────────────────────┘
```

### Key Technologies

- **@react-native-firebase/messaging** (`^21.7.1`) - FCM integration
- **@notifee/react-native** (`^9.1.1`) - iOS notification handling
- **React Navigation** - Deep linking
- **Redux Toolkit** - State management

**⚠️ Important**: The app uses **FCM HTTP v1 API exclusively**. Legacy FCM APIs were shut down by Firebase on June 20, 2024.

---

## Clean Architecture Layers

### Layer Responsibilities

1. **Domain Layer** (Innermost)
   - Pure business logic
   - No dependencies on external frameworks
   - Entities and use cases

2. **Data Layer**
   - Data sources and repositories
   - API clients
   - Data transformation

3. **Infrastructure Layer**
   - Platform-specific implementations
   - External SDKs (FCM, Notifee)
   - Network clients

4. **Presentation Layer** (Outermost)
   - UI components
   - State management (Redux)
   - Navigation
   - User interactions

### Dependency Rule

**Dependencies point inward**: Presentation → Domain ← Data → Infrastructure

---

## Domain Layer

### Entities

Entities represent core business objects with no framework dependencies.

#### Notification Entity

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

#### Notification Type

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

#### Primary Actor Types

**File**: `src/types/Notification.ts:14`

```typescript
export type PrimaryActorType = 'Conversation' | 'Message';
```

### Domain Constants

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

### Use Cases (Business Logic)

#### 1. Register FCM Token

**Business Rule**: Register device token with backend for push notification delivery.

**Location**: Implemented in Data Layer (`src/store/settings/settingsActions.ts`)

**Domain Logic**:
- Validate device information
- Request permissions if needed
- Generate FCM token
- Register with backend

#### 2. Parse FCM Message

**Business Rule**: Extract notification data from FCM message format.

**Location**: Infrastructure Layer (`src/utils/pushUtils.ts:57-69`)

**Domain Logic**:
- Parse FCM HTTP v1 format
- Extract notification payload
- Transform to domain entity

#### 3. Generate Deep Link

**Business Rule**: Create navigation link from notification data.

**Location**: Infrastructure Layer (`src/utils/pushUtils.ts:25-48`)

**Domain Logic**:
- Validate notification type
- Extract conversation ID based on primary actor type
- Generate URL format

#### 4. Update Badge Count

**Business Rule**: Update iOS app badge with unread notification count.

**Location**: Infrastructure Layer (`src/utils/pushUtils.ts:19-23`)

**Domain Logic**:
- Calculate unread count
- Update badge (iOS only)

---

## Data Layer

### Repository Pattern

The Data Layer implements repositories that abstract data sources.

#### Notification Repository Interface (Conceptual)

```typescript
interface INotificationRepository {
  getNotifications(page: number, sortOrder: string): Promise<NotificationResponse>;
  markAsRead(payload: MarkAsReadPayload): Promise<void>;
  markAllAsRead(): Promise<void>;
  markAsUnread(notificationId: number): Promise<void>;
  delete(notificationId: number): Promise<void>;
}
```

#### Notification Service (Data Source)

**File**: `src/store/notification/notificationService.ts`

This acts as the repository implementation:

```typescript
export class NotificationService {
  static async getNotifications(
    page: number = 1,
    sort_order: InboxSortTypes,
  ): Promise<NotificationResponse> {
    const response = await apiService.get<NotificationAPIResponse>(
      `notifications?sort_order=${sort_order}&includes[]=snoozed&includes[]=read&page=${page}`,
    );
    const { payload, meta } = response.data.data;
    const notifications = payload.map(transformNotification);
    return {
      payload: notifications,
      meta: transformNotificationMeta(meta),
    };
  }

  static async markAllAsRead(): Promise<void> {
    await apiService.post(`notifications/read_all`);
  }

  static async markAsRead(payload: MarkAsReadPayload): Promise<void> {
    await apiService.post(`notifications/read_all`, {
      primary_actor_id: payload.primaryActorId,
      primary_actor_type: payload.primaryActorType,
    });
  }

  static async markAsUnread(notificationId: number): Promise<void> {
    await apiService.post(`notifications/${notificationId}/unread`);
  }

  static async delete(notificationId: number): Promise<void> {
    await apiService.delete(`notifications/${notificationId}`);
  }
}
```

#### Device Registration Repository

**File**: `src/store/settings/settingsService.ts:37-47`

```typescript
static async saveDeviceDetails(payload: PushPayload): Promise<{ fcmToken: string }> {
  const response = await apiService.post<{ fcmToken: string }>(
    'notification_subscriptions',
    payload,
  );
  return response.data;
}

static async removeDevice(payload: RemoveDevicePayload): Promise<void> {
  await apiService.delete('notification_subscriptions', { data: payload });
}
```

### Data Models

#### API Response Models

**File**: `src/store/notification/notificationTypes.ts`

```typescript
export interface NotificationAPIResponse {
  data: {
    meta: {
      unreadCount: number;
      count: number;
      currentPage: string;
    };
    payload: Notification[];
  };
}

export interface NotificationResponse {
  meta: {
    unreadCount: number;
    count: number;
    currentPage: string;
  };
  payload: Notification[];
}
```

#### Payload Models

**File**: `src/store/settings/settingsTypes.ts:40-55`

```typescript
export interface PushPayload {
  subscription_type: string;
  subscription_attributes: {
    deviceName: string;
    devicePlatform: string;
    apiLevel: string;
    brandName: string;
    buildNumber: string;
    push_token: string;
    device_id: string;
  };
}

export interface RemoveDevicePayload {
  push_token: string;
}
```

### Data Transformation

**File**: `src/utils/camelCaseKeys.ts`

Data transformation from API (snake_case) to domain (camelCase):

```typescript
export const transformNotification = (notification: any): Notification => {
  return camelcaseKeys(notification, { deep: true });
};
```

---

## Infrastructure Layer

### FCM Integration

#### FCM Token Management

**File**: `src/store/settings/settingsActions.ts:88-138`

```typescript
saveDeviceDetails: createAsyncThunk<{ fcmToken: string }, void>(
  'settings/saveDeviceDetails',
  async (_, { rejectWithValue }) => {
    try {
      // 1. Check permissions
      const permissionEnabled = await messaging().hasPermission();
      
      // 2. Request permissions if needed
      if (!permissionEnabled || permissionEnabled === -1) {
        if (isAndroidAPILevelGreater32) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        await messaging().requestPermission();
      }

      // 3. Get FCM token (with workaround delay)
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await sleep(1000); // Workaround for timing issue
      const fcmToken = await messaging().getToken();

      // 4. Register with backend
      const pushData: PushPayload = {
        subscription_type: 'fcm',
        subscription_attributes: {
          deviceName,
          devicePlatform,
          apiLevel: apiLevel.toString(),
          brandName,
          buildNumber,
          push_token: fcmToken,
          device_id: deviceId,
        },
      };
      
      await SettingsService.saveDeviceDetails(pushData);
      return { fcmToken };
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Error saving device details',
      );
    }
  },
),
```

#### FCM Message Parsing

**File**: `src/utils/pushUtils.ts:57-69`

```typescript
interface FCMMessage {
  data?: {
    payload?: string;      // FCM HTTP v1 format
    notification?: string;  // Legacy format (deprecated)
  };
}

export const findNotificationFromFCM = ({ message }: { message: FCMMessage }) => {
  let notification = null;
  
  // FCM HTTP v1 format (current)
  if (message?.data?.payload) {
    const parsedPayload = JSON.parse(message.data.payload);
    notification = parsedPayload.data.notification;
  }
  // FCM Legacy format (deprecated, kept for backward compatibility)
  else if (message?.data?.notification) {
    notification = JSON.parse(message.data.notification);
  }
  
  return notification;
};
```

#### Background Message Handler

**File**: `src/navigation/index.tsx:31-33`

```typescript
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  // Background notifications are handled by the OS
  // This handler is for data-only messages
});
```

#### Notification Reception Handlers

**File**: `src/navigation/index.tsx:108-136` (App starting from quit state)

```typescript
async getInitialURL() {
  // Check for notification that opened the app
  const message = await messaging().getInitialNotification();
  if (message) {
    const notification = findNotificationFromFCM({ message });
    const camelCaseNotification = transformNotification(notification);
    const conversationLink = findConversationLinkFromPush({
      notification: camelCaseNotification,
      installationUrl,
    });
    if (conversationLink) {
      return conversationLink; // Navigate to conversation
    }
  }
  return undefined;
}
```

**File**: `src/navigation/index.tsx:154-168` (App running in background)

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
      listener(conversationLink); // Trigger navigation
    }
  }
});
```

### Notifee Integration (iOS)

**File**: `src/utils/pushUtils.ts:5-23`

```typescript
let notifee: typeof import('@notifee/react-native').default | undefined;

if (Platform.OS === 'ios') {
  notifee = require('@notifee/react-native').default;
}

export const updateBadgeCount = async ({ count = 0 }) => {
  if (Platform.OS === 'ios' && count >= 0 && notifee) {
    await notifee.setBadgeCount(count);
  }
};

export const clearAllDeliveredNotifications = async () => {
  if (Platform.OS === 'ios' && notifee) {
    await notifee.cancelAllNotifications();
  }
};
```

### Deep Link Generation

**File**: `src/utils/pushUtils.ts:25-48`

```typescript
export const findConversationLinkFromPush = ({
  notification,
  installationUrl,
}: {
  notification: Notification;
  installationUrl: string;
}) => {
  const { notificationType } = notification;

  // Only generate links for valid notification types
  if (NOTIFICATION_TYPES.includes(notificationType)) {
    const { primaryActor, primaryActorId, primaryActorType } = notification;
    let conversationId = null;
    
    // Extract conversation ID based on primary actor type
    if (primaryActorType === 'Conversation') {
      conversationId = primaryActor.id;
    } else if (primaryActorType === 'Message') {
      conversationId = primaryActor.conversationId;
    }
    
    if (conversationId) {
      // Generate deep link URL
      const conversationLink = `${installationUrl}/app/accounts/1/conversations/${conversationId}/${primaryActorId}/${primaryActorType}`;
      return conversationLink;
    }
  }
  return;
};
```

### API Client

**File**: `src/services/APIService.ts`

The API service handles HTTP communication with the backend:

```typescript
class APIService {
  // Handles authentication, error handling, request/response transformation
  // Used by NotificationService and SettingsService
}
```

### Action Cable Integration

**File**: `src/utils/actionCable.ts:111-119`

Real-time notification updates via WebSocket:

```typescript
onNotificationCreated = (data: NotificationCreatedResponse) => {
  const notification: NotificationCreatedResponse = transformNotificationCreatedResponse(data);
  store.dispatch(addNotification(notification));
  // Badge count is automatically updated
};

onNotificationRemoved = (data: NotificationRemovedResponse) => {
  const notification: NotificationRemovedResponse = transformNotificationRemovedResponse(data);
  store.dispatch(removeNotification(notification));
};
```

---

## Presentation Layer

### State Management (Redux)

#### Notification State

**File**: `src/store/notification/notificationSlice.ts:12-22`

```typescript
export interface NotificationState {
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

#### Redux Slice

**File**: `src/store/notification/notificationSlice.ts:38-137`

```typescript
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: state => {
      notificationsAdapter.removeAll(state);
      state.unreadCount = 0;
      state.totalCount = 0;
      state.currentPage = '1';
      state.error = null;
    },
    addNotification(state, action: PayloadAction<NotificationCreatedResponse>) {
      const { notification, unreadCount } = action.payload;
      notificationsAdapter.addOne(state, notification);
      state.unreadCount = unreadCount;
      updateBadgeCount({ count: unreadCount });
    },
    removeNotification(state, action: PayloadAction<NotificationRemovedResponse>) {
      const { notification, unreadCount } = action.payload;
      notificationsAdapter.removeOne(state, notification.id);
      state.unreadCount = unreadCount;
      updateBadgeCount({ count: unreadCount });
    },
  },
  extraReducers: builder => {
    // Handle async actions
    builder
      .addCase(notificationActions.fetchNotifications.pending, state => {
        state.uiFlags.isLoading = true;
        state.error = null;
      })
      .addCase(notificationActions.fetchNotifications.fulfilled, (state, action) => {
        const { meta, payload } = action.payload;
        state.unreadCount = meta.unreadCount;
        state.totalCount = meta.count;
        state.currentPage = meta.currentPage;
        state.uiFlags.isLoading = false;
        updateBadgeCount({ count: meta.unreadCount });
        // ... update entities
      })
      // ... other cases
  },
});
```

#### Async Actions (Use Cases)

**File**: `src/store/notification/notificationAction.ts`

```typescript
export const notificationActions = {
  fetchNotifications: createAsyncThunk<
    NotificationResponse,
    { page: number; sort_order: InboxSortTypes }
  >('notifications/fetchNotifications', async (payload, { rejectWithValue }) => {
    try {
      return await NotificationService.getNotifications(payload.page, payload.sort_order);
    } catch (error) {
      const { response } = error as AxiosError<ApiErrorResponse>;
      if (!response) {
        throw error;
      }
      return rejectWithValue(response.data);
    }
  }),

  markAsRead: createAsyncThunk<MarkAsReadPayload, MarkAsReadPayload>(
    'notifications/markAsRead',
    async (payload, { rejectWithValue }) => {
      try {
        await NotificationService.markAsRead(payload);
        return payload;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        return rejectWithValue(message);
      }
    },
  ),

  // ... other actions
};
```

### Navigation & Deep Linking

#### Navigation Configuration

**File**: `src/navigation/index.tsx:50-64`

```typescript
const linking = {
  prefixes: [installationUrl, SSO_CALLBACK_URL],
  config: {
    screens: {
      ChatScreen: {
        path: 'app/accounts/:accountId/conversations/:conversationId/:primaryActorId?/:primaryActorType?',
        parse: {
          conversationId: (conversationId: string) => parseInt(conversationId),
          primaryActorId: (primaryActorId: string) => parseInt(primaryActorId),
          primaryActorType: (primaryActorType: string) => decodeURIComponent(primaryActorType),
        },
      },
    },
  },
  getInitialURL: async () => {
    // Handle app starting from notification
  },
  subscribe: (listener) => {
    // Handle app backgrounded notification tap
  },
};
```

#### Path Processing

**File**: `src/navigation/index.tsx:66-106`

```typescript
getStateFromPath: (path: string, config: any) => {
  // Handle SSO callback
  if (path.includes(SSO_CALLBACK_URL) || path.includes('auth/saml')) {
    const ssoParams = SsoUtils.parseCallbackUrl(`chatwootapp://${path}`);
    SsoUtils.handleSsoCallback(ssoParams, dispatch);
    return undefined;
  }

  // Extract conversation details from URL
  const conversationId = extractConversationIdFromUrl({ url: path });
  if (!conversationId) {
    return;
  }

  // Return navigation state
  return {
    routes: [
      {
        name: 'ChatScreen',
        params: {
          conversationId: conversationId,
          primaryActorId,
          primaryActorType,
        },
      },
    ],
  };
}
```

### UI Components

#### Notification List Screen

**File**: `src/screens/inbox/InboxScreen.tsx`

- Displays list of notifications
- Handles pagination
- Shows read/unread status
- Swipe actions (mark as read, delete)

#### Notification Preferences

**File**: `src/components-next/sheet-components/NotificationPreferences.tsx`

- User preference toggles
- Updates notification settings via Redux

#### Notification Item

**File**: `src/screens/inbox/components/InboxItemContainer.tsx`

- Individual notification display
- Notification type indicators
- Tap to navigate to conversation

---

## Cross-Cutting Concerns

### Error Handling

#### Token Registration Errors

**File**: `src/store/settings/settingsActions.ts:131-136`

```typescript
catch (error) {
  Sentry.captureException(error);
  return rejectWithValue(
    error instanceof Error ? error.message : 'Error saving device details',
  );
}
```

#### Notification Parsing Errors

Graceful handling:
- Log error
- Don't navigate (safe fallback)
- Continue normal app operation

### Logging & Monitoring

- **Sentry**: Error tracking
- **Console logs**: Development debugging
- **Redux DevTools**: State inspection

### Platform-Specific Handling

#### iOS

**File**: `app.config.ts:30,35`

```typescript
UIBackgroundModes: ['fetch', 'remote-notification']
entitlements: { 'aps-environment': 'production' }
```

**File**: `firebase.json:3`

```json
{
  "react-native": {
    "messaging_ios_auto_register_for_remote_messages": true
  }
}
```

#### Android

**File**: `src/store/settings/settingsActions.ts:100-109`

```typescript
const isAndroidAPILevelGreater32 = apiLevel > 32 && Platform.OS === 'android';

if (!permissionEnabled || permissionEnabled === -1) {
  if (isAndroidAPILevelGreater32) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  await messaging().requestPermission();
}
```

---

## Data Flow

### FCM Token Registration Flow

```
1. User logs in / App starts
   ↓
2. Presentation Layer: dispatch(saveDeviceDetails())
   ↓
3. Infrastructure Layer: messaging().requestPermission()
   ↓
4. Infrastructure Layer: messaging().getToken()
   ↓
5. Data Layer: SettingsService.saveDeviceDetails(payload)
   ↓
6. Infrastructure Layer: APIService.post('/notification_subscriptions')
   ↓
7. Backend: Stores device token
   ↓
8. Presentation Layer: Redux state updated
```

### Notification Reception Flow

```
1. FCM receives notification
   ↓
2. Infrastructure Layer: messaging().onNotificationOpenedApp()
   ↓
3. Infrastructure Layer: findNotificationFromFCM(message)
   ↓
4. Domain Layer: Parse notification entity
   ↓
5. Infrastructure Layer: findConversationLinkFromPush(notification)
   ↓
6. Presentation Layer: Navigation handles deep link
   ↓
7. Presentation Layer: ChatScreen opens with conversation ID
```

### Notification List Update Flow

```
1. User opens notification list
   ↓
2. Presentation Layer: dispatch(fetchNotifications())
   ↓
3. Data Layer: NotificationService.getNotifications()
   ↓
4. Infrastructure Layer: APIService.get('/notifications')
   ↓
5. Data Layer: Transform API response to domain entities
   ↓
6. Presentation Layer: Redux slice updates state
   ↓
7. UI: Notification list re-renders
```

### Real-Time Update Flow (Action Cable)

```
1. Backend: Notification created
   ↓
2. Infrastructure Layer: Action Cable receives 'notification.created' event
   ↓
3. Infrastructure Layer: Transform notification data
   ↓
4. Presentation Layer: dispatch(addNotification(notification))
   ↓
5. Presentation Layer: Redux slice updates state
   ↓
6. Infrastructure Layer: updateBadgeCount(unreadCount)
   ↓
7. UI: Notification appears in list, badge updates
```

---

## Key Files Reference

### Domain Layer

| File | Purpose |
|------|---------|
| `src/types/Notification.ts` | Notification entity and types |
| `src/constants/index.ts` | Domain constants (NOTIFICATION_TYPES) |

### Data Layer

| File | Purpose |
|------|---------|
| `src/store/notification/notificationService.ts` | Notification repository implementation |
| `src/store/settings/settingsService.ts` | Device registration repository |
| `src/store/notification/notificationTypes.ts` | API response models |
| `src/store/settings/settingsTypes.ts` | Payload models |
| `src/utils/camelCaseKeys.ts` | Data transformation |

### Infrastructure Layer

| File | Purpose |
|------|---------|
| `src/utils/pushUtils.ts` | FCM message parsing, deep link generation, badge management |
| `src/services/APIService.ts` | HTTP client |
| `src/utils/actionCable.ts` | WebSocket integration |
| `app.config.ts` | Platform configuration |
| `firebase.json` | Firebase settings |

### Presentation Layer

| File | Purpose |
|------|---------|
| `src/store/notification/notificationSlice.ts` | Redux state management |
| `src/store/notification/notificationAction.ts` | Async actions (use cases) |
| `src/store/settings/settingsActions.ts` | Device registration actions |
| `src/navigation/index.tsx` | Navigation and deep linking |
| `src/screens/inbox/InboxScreen.tsx` | Notification list UI |
| `src/components-next/sheet-components/NotificationPreferences.tsx` | Preferences UI |

---

## Testing Strategy

### Unit Tests

#### Domain Layer Tests

**File**: `src/utils/specs/pushUtils.spec.ts`

```typescript
describe('findNotificationFromFCM', () => {
  it('should return notification from FCM HTTP v1 message', () => {
    const message = {
      data: {
        payload: '{"data": {"notification": {"id": 123, "title": "Test Notification"}}}',
      },
    };
    const result = findNotificationFromFCM({ message });
    expect(result).toEqual({ id: 123, title: 'Test Notification' });
  });
});

describe('findConversationLinkFromPush', () => {
  it('should return conversation link if notification_type is conversation_creation', () => {
    const notification = {
      id: 8687,
      notificationType: 'conversation_creation',
      primaryActorId: 14902,
      primaryActorType: 'Conversation',
      primaryActor: { id: 14428 },
    };
    const installationUrl = 'https://app.chatwoot.com';
    const result = findConversationLinkFromPush({ notification, installationUrl });
    expect(result).toBe(
      'https://app.chatwoot.com/app/accounts/1/conversations/14428/14902/Conversation'
    );
  });
});
```

### Integration Tests

Test data flow across layers:
- FCM token registration end-to-end
- Notification reception and navigation
- Action Cable real-time updates

### Mocks

**File**: `__mocks__/@react-native-firebase/messaging.js`

```javascript
jest.mock('@react-native-firebase/messaging', () => () => {
  return {
    getToken: jest.fn(() => Promise.resolve('fd79y-tiw4t-9ygv2-4fiw4-yghqw-4t79f')),
  };
});
```

**File**: `__mocks__/@notifee/react-native.js`

```javascript
jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));
```

---

## Summary

The mobile push notification system follows Clean Architecture principles:

1. **Domain Layer**: Pure business logic with entities and use cases
2. **Data Layer**: Repositories and data sources with transformation
3. **Infrastructure Layer**: Platform-specific implementations (FCM, Notifee, API)
4. **Presentation Layer**: UI, state management, and navigation

### Key Benefits

- **Separation of Concerns**: Each layer has clear responsibilities
- **Testability**: Business logic is independent of frameworks
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Easy to add new features or change implementations

### Current Implementation Status

✅ **Implemented**:
- FCM token registration
- Notification reception (all app states)
- Deep linking
- Badge count management (iOS)
- Real-time updates (Action Cable)
- State management (Redux)

The system is production-ready and follows React Native and Clean Architecture best practices.
