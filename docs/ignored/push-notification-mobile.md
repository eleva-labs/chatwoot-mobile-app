# Mobile Push Notification System - Clean Architecture

## Table of Contents
1. [Overview](#overview)
2. [Clean Architecture Layers](#clean-architecture-layers)
3. [Domain Layer](#domain-layer)
4. [Infrastructure Layer](#infrastructure-layer)
5. [Infrastructure Layer](#infrastructure-layer)
6. [Presentation Layer](#presentation-layer)
7. [Cross-Cutting Concerns](#cross-cutting-concerns)
8. [Data Flow](#data-flow)
9. [Key Files Reference](#key-files-reference)
10. [Testing Strategy](#testing-strategy)

---

## Overview

This document describes the **mobile client-side** push notification system in the Chatwoot Mobile App, organized according to **Clean Architecture** principles.

### System Overview

The Chatwoot notification system is a multi-channel framework that supports:
- **In-App Notifications**: Real-time notifications displayed within the app (fetched via API)
- **Mobile Push Notifications**: FCM (Firebase Cloud Messaging) system-level alerts
- **Real-Time Updates**: Action Cable WebSocket for live notification sync

**Key Distinction**: 
- **Push Notifications (FCM)**: System-level alerts that appear in the notification tray, work when app is closed/backgrounded
- **In-App Notifications**: List of notifications displayed in the app UI (`InboxScreen`), fetched via API and updated via Action Cable

Both systems use the same `Notification` entity but serve different purposes and have different delivery mechanisms.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  (UI Components, Navigation, Custom Hooks)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Domain Layer                          │
│  (Entities, Use Cases, Business Logic, Interfaces)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Infrastructure Layer                        │
│  (Repositories, Transformers, FCM SDK, Notifee)         │
│  (API Client, Platform APIs, Redux Store)               │
│  └─ Repositories dispatch to Redux                      │
│  └─ Redux Persist (Storage)                             │
└─────────────────────────────────────────────────────────┘
```

**Key Architectural Principle**: Redux is treated as **Infrastructure** (state management mechanism), not Presentation. Repositories in the Infrastructure Layer dispatch to Redux, keeping Use Cases and Domain logic framework-independent.

### Backend Notification Creation Flow

The backend creates notifications through an event-driven system:

```
Event Trigger (Conversation/Message/Assignment)
    ↓
Event Dispatcher
    ↓
NotificationListener
    ↓
NotificationBuilder (validates preferences, block status)
    ↓
Notification Model (created in database)
    ↓
after_create_commit callbacks:
    ├── process_notification_delivery
    │   ├── PushNotificationJob (async) → FCM delivery
    │   ├── EmailNotificationJob (async)
    │   └── RemoveDuplicateNotificationJob
    └── dispatch_create_event
        ↓
ActionCableListener
    ↓
WebSocket Broadcast to User
    ↓
Mobile App Receives via Action Cable (if app running)
```

**Key Backend Components**:
- **NotificationBuilder**: Validates user preferences and conversation status before creating
- **PushNotificationService**: Handles FCM delivery via FCM v1 API
- **ActionCableListener**: Broadcasts notification events to connected clients
- **NotificationSubscription**: Stores device tokens and subscription details

### Key Technologies

- **@react-native-firebase/messaging** (`^21.7.1`) - FCM integration
- **@notifee/react-native** (`^9.1.1`) - iOS notification handling
- **React Navigation** - Deep linking
- **Redux Toolkit** - State management (Infrastructure layer)
- **Redux Persist** - State persistence (Infrastructure layer)

**⚠️ Important**: The app uses **FCM HTTP v1 API exclusively**. Legacy FCM APIs were shut down by Firebase on June 20, 2024. The backend must be configured to send notifications using the HTTP v1 API format.

---

## Clean Architecture Layers

### Layer Responsibilities

1. **Domain Layer** (Innermost)
   - Pure business logic
   - No dependencies on external frameworks
   - Entities, use cases, and interfaces
   - Framework-independent

2. **Infrastructure Layer**
   - Repository implementations
   - Data transformation (API → Domain)
   - Platform-specific implementations
   - External SDKs (FCM, Notifee)
   - Network clients (APIService)
   - **Redux Store** (state management mechanism)
   - **Redux Persist** (storage/persistence)
   - Device APIs
   - **Repositories dispatch to Redux**

4. **Presentation Layer** (Outermost)
   - UI components
   - Navigation
   - Custom hooks
   - User interactions
   - **Reads from Redux** via selectors

### Dependency Rule

**Dependencies point inward**: Presentation → Domain ← Infrastructure

**Redux Architecture Pattern** (following [Clean Architecture with Redux](https://dev.to/juanoa/how-to-implement-redux-in-a-clean-architecture-1dcp)):
- **Redux as Infrastructure**: State management mechanism (like a database)
- **Repositories dispatch**: Infrastructure Layer repositories handle Redux dispatch
- **Use Cases abstracted**: Domain layer doesn't know about Redux
- **Minimal reducers**: Only "save" and "delete" operations
- **Components read directly**: Presentation layer uses selectors for reactive UI

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

### Notification Types and Triggers

The system supports 8 distinct notification types, each with specific triggers and behaviors:

#### 1. Conversation Creation (`conversation_creation: 1`)

**Backend Trigger**: 
- New conversation created in an inbox
- Bot handoff (when conversation transitions from `pending` to `open`)

**Recipients**: All inbox members

**User Subscription**: 
- **NOT enabled by default** (requires explicit opt-in)
- Users must enable in notification preferences

**Push Title**: Uses i18n key `notifications.notification_title.conversation_creation` with `display_id` and `inbox_name`

**Body**: First message in the conversation

**Conditions**:
- Conversation must not be in `pending` status
- User must be subscribed to this notification type (unlike other types, this requires opt-in)

#### 2. Conversation Assignment (`conversation_assignment: 2`)

**Backend Trigger**: Conversation is assigned to an agent

**Recipients**: The newly assigned agent

**Push Title**: Uses i18n key `notifications.notification_title.conversation_assignment` with `display_id`

**Body**: Last message in the conversation (incoming or outgoing)

**Default Setting**: **Enabled by default** for push notifications

**Conditions**:
- Assignee must be present (not nil)
- Conversation must not be in `pending` status
- Self-assignments are skipped

#### 3. Assigned Conversation New Message (`assigned_conversation_new_message: 3`)

**Backend Trigger**: New message arrives in a conversation assigned to an agent

**Recipients**: The conversation assignee

**Push Title**: Uses i18n key `notifications.notification_title.assigned_conversation_new_message` with `display_id`

**Body**: The new message content

**Conditions**:
- Conversation must have an assignee
- Assignee must not be the message sender
- User must not already be notified for this message (duplicate check)

**Email Behavior**: Only sent if agent is offline (checked via `OnlineStatusTracker`)

#### 4. Conversation Mention (`conversation_mention: 4`)

**Backend Trigger**: User is mentioned in a message using `@mention` syntax

**Recipients**: Mentioned users

**Push Title**: Uses i18n key `notifications.notification_title.conversation_mention` with `display_id`

**Body**: The message that contains the mention

**Special Behavior**: 
- Supports team mentions (expands to all team members)
- Automatically adds mentioned users as conversation participants
- **Not blocked by conversation block status** (unlike other notification types)

**Conditions**:
- Message must be private
- Message content must contain mentions
- Mentioned users must be valid (admins or inbox members)

#### 5. Participating Conversation New Message (`participating_conversation_new_message: 5`)

**Backend Trigger**: New message in a conversation where user is a participant

**Recipients**: All conversation participants (except the sender)

**Push Title**: Uses i18n key `notifications.notification_title.assigned_conversation_new_message` with `display_id`

**Body**: The new message content

**Conditions**:
- User must be a conversation participant
- User must not be the message sender
- User must not already be notified (prevents duplicate with mention/assignment notifications)

**Email Behavior**: Only sent if agent is offline

#### 6-8. SLA Notifications (Enterprise Edition)

**Note**: These notification types are only available in the Enterprise edition of Chatwoot.

**Types**:
- `sla_missed_first_response: 6` - First response time SLA missed
- `sla_missed_next_response: 7` - Next response time SLA missed
- `sla_missed_resolution: 8` - Resolution time SLA missed

**Backend Trigger**: SLA policy threshold is missed

**Recipients**: 
- Conversation participants
- Account administrators
- Conversation assignee

**Push Title**: Uses respective i18n keys with `display_id`

**Body**: Last message in the conversation

### Use Cases (Business Logic)

#### 1. Register FCM Token

**Business Rule**: Register device token with backend for push notification delivery.

**Location**: Implemented in Infrastructure Layer (`src/store/settings/settingsActions.ts`)

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

## Infrastructure Layer

### Repository Pattern

The Infrastructure Layer implements repositories that abstract data sources.

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

#### Notification Repository (Data Source)

**File**: `src/store/notification/notificationService.ts`

This acts as the repository implementation. **Following Clean Architecture principles**, repositories dispatch to Redux (Infrastructure) after API operations:

```typescript
import { store } from '@/infrastructure/state-management/store';
import { addNotificationsToStore, deleteNotificationsFromStore } from '@/store/notification/notificationSlice';

export class NotificationService {
  static async getNotifications(
    page: number = 1,
    sort_order: InboxSortTypes,
  ): Promise<NotificationResponse> {
    // 1. Fetch from API
    const response = await apiService.get<NotificationAPIResponse>(
      `notifications?sort_order=${sort_order}&includes[]=snoozed&includes[]=read&page=${page}`,
    );
    const { payload, meta } = response.data.data;
    const notifications = payload.map(transformNotification);
    
    // 2. Dispatch to Redux (Infrastructure concern)
    store.dispatch(addNotificationsToStore(notifications));
    
    // 3. Return for use case/component
    return {
      payload: notifications,
      meta: transformNotificationMeta(meta),
    };
  }

  static async markAllAsRead(): Promise<void> {
    await apiService.post(`notifications/read_all`);
    // Redux update handled by Action Cable or separate update call
  }

  static async markAsRead(payload: MarkAsReadPayload): Promise<void> {
    await apiService.post(`notifications/read_all`, {
      primary_actor_id: payload.primaryActorId,
      primary_actor_type: payload.primaryActorType,
    });
    // Redux update handled by Action Cable or separate update call
  }

  static async markAsUnread(notificationId: number): Promise<void> {
    await apiService.post(`notifications/${notificationId}/unread`);
    // Redux update handled by Action Cable or separate update call
  }

  static async delete(notificationId: number): Promise<void> {
    // 1. Remove from Redux first (optimistic update)
    store.dispatch(deleteNotificationsFromStore([notificationId]));
    
    // 2. Delete from backend
    await apiService.delete(`notifications/${notificationId}`);
  }
  
  // Read operations (from Redux)
  static getFromStore(): Notification[] {
    const state = store.getState();
    return selectAllNotifications(state);
  }
  
  static getById(id: number): Notification | undefined {
    const state = store.getState();
    return selectNotificationById(state, id);
  }
}
```

**Key Pattern**: 
- **Write operations**: API call → Dispatch to Redux → Return data
- **Read operations**: Direct Redux state access via selectors
- **Repository responsibility**: Coordinates between API and Redux (Infrastructure)

#### Backend API Endpoints

**Base URL**: `/api/v1/accounts/:account_id/notifications`

**Endpoints**:

1. **GET `/notifications`** - List notifications
   - Query params: `sort_order` (`asc` | `desc`), `includes[]` (`read`, `snoozed`), `page`
   - Returns: `{ data: { meta: { unreadCount, count, currentPage }, payload: Notification[] } }`
   - Uses `NotificationFinder` for efficient querying with pagination (15 per page)

2. **POST `/notifications/read_all`** - Mark notifications as read
   - Body (optional): `{ primary_actor_id, primary_actor_type }` for conversation-specific
   - Uses bulk update (`update_all`) for performance

3. **POST `/notifications/:id/unread`** - Mark notification as unread

4. **PATCH `/notifications/:id`** - Update notification (e.g., snooze)

5. **DELETE `/notifications/:id`** - Delete notification

6. **POST `/notifications/destroy_all`** - Bulk deletion
   - Body: `{ type: 'read' }` (optional, deletes all if omitted)
   - Runs async via `DeleteNotificationJob`

7. **GET `/notifications/unread_count`** - Get unread count
   - Returns: `{ unread_count: number }`

**Backend Response Format**:
```json
{
  "data": {
    "meta": {
      "unread_count": 5,
      "count": 25,
      "current_page": "1"
    },
    "payload": [
      {
        "id": 123,
        "notification_type": "conversation_assignment",
        "push_message_title": "Conversation #123 has been assigned to you",
        "push_message_body": "John Doe: Hello, I need help...",
        "primary_actor_type": "Conversation",
        "primary_actor_id": 456,
        "primary_actor": { /* conversation push_event_data */ },
        "read_at": null,
        "secondary_actor": { /* message or user push_event_data */ },
        "user": { /* user push_event_data */ },
        "created_at": 1234567890,
        "last_activity_at": 1234567890,
        "snoozed_until": null,
        "meta": {}
      }
    ]
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

#### Subscription Management (Backend Context)

**Backend Model**: `NotificationSubscription`

**Subscription Types**:
- `browser_push: 1` - Web Push API subscriptions (not used in mobile)
- `fcm: 2` - Firebase Cloud Messaging subscriptions (mobile)

**Subscription Attributes Structure** (FCM):
```json
{
  "push_token": "device_fcm_token",
  "device_id": "unique_device_identifier",
  "deviceName": "Manufacturer Model",
  "devicePlatform": "iOS" | "Android",
  "apiLevel": "33",
  "brandName": "Apple" | "Samsung",
  "buildNumber": "1.0.0"
}
```

**Backend Behavior**:
- Uses `device_id` as the unique identifier to prevent duplicates
- If subscription with same `device_id` exists but belongs to different user, it's automatically transferred to current user
- Invalid/expired subscriptions are automatically removed when FCM delivery fails
- Multiple subscriptions per user are supported (multiple devices)

**API Endpoint**: `POST /api/v1/notification_subscriptions`
- Creates or updates subscription based on `device_id` identifier
- Returns `{ fcmToken: string }` on success

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

### Redux as Infrastructure: Architectural Pattern

This implementation follows the **Redux as Infrastructure** pattern from [Clean Architecture with Redux](https://dev.to/juanoa/how-to-implement-redux-in-a-clean-architecture-1dcp), where Redux is treated as a state management mechanism (like a database) rather than business logic.

#### Core Principles

1. **Redux = Database-like Store**
   - Simple operations: "save" and "delete"
   - Not coupled to business logic
   - Repository layer handles dispatch

2. **Repositories Dispatch to Redux**
   - Infrastructure Layer repositories coordinate between API and Redux
   - Use cases don't know about Redux
   - Easy to swap state management

3. **Minimal Reducers**
   - Only save and delete operations
   - No complex business logic in reducers
   - Business logic stays in use cases (Domain layer)

4. **Components Read Directly**
   - Presentation layer uses selectors for reactive UI
   - Good performance with memoized selectors
   - Framework-aware (acceptable in Presentation layer)

#### Architecture Flow

```
Component (Presentation)
    ↓ dispatch
Async Thunk (Presentation - thin coordinator)
    ↓ calls
Use Case (Domain - business logic)
    ↓ calls
Repository (Data)
    ├─ API call (Infrastructure)
    └─ store.dispatch() (Infrastructure - Redux)
        ↓
Redux Store (Infrastructure)
    ↓
Component reads via selector (Presentation - reactive)
```

#### Benefits

- ✅ **Framework Independence**: Use cases work without Redux
- ✅ **Easy to Swap**: Can replace Redux with Zustand, MobX, etc.
- ✅ **Testability**: Business logic testable without Redux mocks
- ✅ **Centralized Mutations**: All state changes in repositories
- ✅ **Clear Separation**: Domain logic independent of state management

### Redux Store Configuration

**File**: `src/store/index.ts`

Redux is configured as Infrastructure - a state management mechanism:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';

const persistConfig = {
  key: 'Root',
  version: CURRENT_VERSION,
  storage: AsyncStorage, // Infrastructure: Storage mechanism
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  // ... middleware configuration
});

export const persistor = persistStore(store);
```

**Redux as Infrastructure**:
- Store configuration (technical setup)
- Persistence mechanism (AsyncStorage)
- State management abstraction
- Could be swapped for Zustand, MobX, etc.

**Redux Slice Pattern** (Minimal Operations):

Following the Clean Architecture approach, reducers only have "save" and "delete" operations:

```typescript
// src/store/notification/notificationSlice.ts
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Only save and delete operations
    addNotificationsToStore: (state, action: PayloadAction<Notification[]>) => {
      notificationsAdapter.upsertMany(state, action.payload);
    },
    deleteNotificationsFromStore: (state, action: PayloadAction<number[]>) => {
      notificationsAdapter.removeMany(state, action.payload);
    },
  },
});
```

**Benefits**:
- Simple, predictable state mutations
- Business logic stays in Use Cases (Domain layer)
- Easy to swap state management
- Repositories handle dispatch (Infrastructure layer)

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

#### FCM Payload Structure (Backend → Mobile)

The backend sends FCM notifications using the HTTP v1 API format. The payload structure is:

```json
{
  "token": "device_fcm_token",
  "data": {
    "payload": {
      "data": {
        "notification": {
          "id": 123,
          "notification_type": "conversation_assignment",
          "primary_actor_id": 456,
          "primary_actor_type": "Conversation",
          "primary_actor": {
            "conversation_id": 456,
            "id": 456
          },
          "push_message_title": "Conversation #123 has been assigned to you",
          "push_message_body": "John Doe: Hello, I need help..."
        }
      }
    }
  },
  "notification": {
    "title": "Notification title",
    "body": "Notification body"
  },
  "android": {
    "priority": "high"
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "category": "1234567890"
      }
    }
  }
}
```

**Key Fields**:
- `data.payload.data.notification`: Contains the full notification object (parsed by `findNotificationFromFCM`)
- `notification.title` and `notification.body`: Displayed in the system notification tray
- Platform-specific options: Android (high priority), iOS (sound, category)

**Mobile Parsing**:
- The `data.payload` field contains a JSON string that must be parsed
- The parsed payload contains `data.notification` with the notification entity
- This notification object matches the `Notification` type in the mobile app

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

#### Backend Action Cable Events

**Event Types**:
- `notification.created` - New notification created
- `notification.updated` - Notification updated (read, snoozed, etc.)
- `notification.deleted` - Notification deleted

**Event Payload Structure**:
```json
{
  "notification": { /* push_event_data - full notification object */ },
  "unread_count": 5,
  "count": 10
}
```

**Backend Broadcast Flow**:
1. Notification created/updated/deleted in database
2. `after_create_commit` / `after_update_commit` / `after_destroy_commit` callbacks trigger
3. Event dispatched via `EventDispatcher`
4. `ActionCableListener` receives event
5. Broadcasts to user's WebSocket channel (using `pubsub_token`)
6. Mobile app receives via Action Cable connection
7. Redux store updated automatically

**When Action Cable Works**:
- App is running (foreground or background)
- WebSocket connection is active
- User is authenticated

**When Push Notifications Work**:
- App is closed or backgrounded
- FCM delivers system-level notification
- User taps notification → app opens → deep link navigation

**Complementary Systems**: Action Cable and FCM work together to provide complete coverage:
- **FCM**: System alerts when app is not running
- **Action Cable**: Real-time updates when app is running

---

## Presentation Layer

### Reading from Redux

**Pattern**: Components read directly from Redux using selectors (Presentation concern)

**File**: `src/screens/inbox/InboxScreen.tsx`

```typescript
const InboxScreen = () => {
  // Direct Redux access via selectors (Presentation layer)
  const isLoading = useAppSelector(selectIsLoadingNotifications);
  const notifications = useAppSelector(selectAllNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Trigger fetch (repository handles Redux dispatch)
    dispatch(fetchNotifications({ page: 1, sortOrder: 'desc' }));
  }, []);
  
  return (
    <View>
      {isLoading ? <Spinner /> : <NotificationList data={notifications} />}
    </View>
  );
};
```

**Why Direct Selectors?**:
- React-Redux integration (reactive UI updates)
- Good performance with memoized selectors
- Presentation layer can be framework-aware
- Use cases remain abstracted (Domain layer)

### Async Thunks (Thin Coordinators)

**File**: `src/store/notification/notificationAction.ts`

Async thunks are thin coordinators that call use cases:

```typescript
export const notificationActions = {
  fetchNotifications: createAsyncThunk<
    NotificationResponse,
    { page: number; sort_order: InboxSortTypes }
  >('notifications/fetchNotifications', async (payload, { rejectWithValue }) => {
    try {
      // Use case executes business logic (Domain layer)
      const useCase = new FetchNotificationsUseCase(NotificationService);
      return await useCase.execute(payload.page, payload.sort_order);
      // Repository handles Redux dispatch internally
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
        const useCase = new MarkNotificationAsReadUseCase(NotificationService);
        await useCase.execute(payload);
        return payload;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        return rejectWithValue(message);
      }
    },
  ),
};
```

**Async Thunk Responsibilities**:
- Thin coordinator (calls use case)
- Handles Redux-specific concerns (loading, errors)
- Returns data for reducer
- **No business logic** (stays in use cases)

### Redux Selectors

**File**: `src/store/notification/notificationSelectors.ts`

Selectors provide reactive data access for components:

```typescript
export const selectNotificationsState = (state: RootState) => state.notifications;

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationById,
} = notificationsAdapter.getSelectors<RootState>(selectNotificationsState);

export const selectUnreadCount = createSelector(
  selectNotificationsState,
  state => state.unreadCount
);

export const selectIsLoadingNotifications = createSelector(
  selectNotificationsState,
  state => state.uiFlags.isLoading
);
```

**Selector Pattern**:
- Memoized for performance
- Used by components (Presentation layer)
- Can be used by repositories for read operations (Infrastructure layer)

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

**Backend Context - Notification Settings**:

**Model**: `NotificationSetting` (per account, per user)

**Default Settings** (when user added to account):
- **Email flags**: Empty array (no emails by default)
- **Push flags**: `[:push_conversation_assignment]` (only assignment notifications enabled)

**Flag System**: Uses bitmask storage (`FlagShihTzu` gem on backend)
- Single integer column stores multiple flags
- Efficient database storage
- Separate flags for email and push notifications

**Available Preferences**:
- `conversation_creation` - New conversation created (requires opt-in)
- `conversation_assignment` - Conversation assigned (enabled by default for push)
- `assigned_conversation_new_message` - New message in assigned conversation
- `conversation_mention` - User mentioned in message
- `participating_conversation_new_message` - New message in participating conversation
- `sla_missed_first_response` - SLA first response missed (Enterprise)
- `sla_missed_next_response` - SLA next response missed (Enterprise)
- `sla_missed_resolution` - SLA resolution missed (Enterprise)

**API Endpoint**: `PATCH /api/v1/accounts/:account_id/notification_settings`
- Body: `{ selected_email_flags: [], selected_push_flags: [] }`
- Updates bitmask flags on backend
- Returns updated settings

**Important**: 
- `conversation_creation` notifications are **NOT enabled by default** (unlike other types)
- Users must explicitly opt-in to receive conversation creation notifications
- Other notification types follow default settings (assignment enabled, others disabled)

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

#### Backend Error Handling Context

**FCM Delivery Errors** (handled on backend):

1. **Invalid Token**:
   - Backend automatically destroys subscription
   - Logged as info
   - No exception tracking

2. **Other FCM Errors**:
   - Logged
   - Exception tracked if needed
   - Subscription kept for retry

**Subscription Cleanup**:
- Expired/invalid subscriptions automatically removed
- Handled in error handlers during push delivery
- Prevents orphaned subscriptions

**Notification Creation Errors** (backend):
- **Missing Settings**: Gracefully handled (returns false), user simply doesn't receive notification
- **Blocked Contact**: Prevented by `NotificationBuilder` validation, notifications skipped
- **Nil Assignee**: Prevented by listener checks, returns early
- **Pending Conversations**: Skipped (notifications only for actionable conversations)

**Mobile Error Handling**:
- FCM parsing errors: Graceful fallback, app continues normally
- API errors: Handled via Redux error state, user feedback via toasts
- Network errors: Retry logic in Redux thunks, offline handling

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

## Backend Notification Lifecycle

### Notification Creation Flow (Backend)

1. **Event Triggered**:
   - Conversation created/assigned
   - Message sent
   - User mentioned
   - SLA threshold missed

2. **Event Dispatched**:
   - Via Rails event dispatcher
   - Event includes relevant data (conversation, message, user, etc.)

3. **NotificationListener Processes**:
   - Determines recipients
   - Calls `NotificationBuilder` for each recipient

4. **NotificationBuilder Validates**:
   - Checks user notification preferences (`user_subscribed_to_notification?`)
   - Checks conversation block status (except mentions)
   - Checks conversation status (skips pending)
   - Validates assignee presence (for assignment notifications)

5. **Notification Created**:
   - Record created in database
   - `before_create`: Sets `last_activity_at`
   - `after_create_commit` callbacks execute

6. **Delivery Jobs Enqueued** (async):
   - `PushNotificationJob` → Sends FCM push
   - `EmailNotificationJob` → Sends email (if offline)
   - `RemoveDuplicateNotificationJob` → Removes duplicates

7. **Real-Time Broadcast**:
   - `ActionCableListener` receives `notification.created` event
   - Broadcasts to user's WebSocket channel
   - Mobile app receives if connected

### Notification Update Flow (Backend)

1. **User Action** (via mobile API):
   - Mark as read
   - Snooze notification
   - Mark as unread

2. **Controller Updates**:
   - Updates notification record in database
   - Triggers `after_update_commit` callback

3. **Event Dispatched**:
   - `NOTIFICATION_UPDATED` event
   - `ActionCableListener` broadcasts update

4. **Mobile App Receives**:
   - Action Cable WebSocket message
   - Redux store updated
   - UI reflects changes

### Notification Deletion Flow (Backend)

1. **User Action or Cleanup**:
   - User deletes notification
   - Bulk deletion job
   - Old notification cleanup (> 1 month)

2. **Record Destroyed**:
   - Triggers `after_destroy_commit` callback

3. **Event Dispatched**:
   - `NOTIFICATION_DELETED` event
   - Uses primitive data (record already deleted)

4. **Mobile App Receives**:
   - Action Cable WebSocket message
   - Notification removed from Redux store
   - UI updated

### Edge Cases and Special Scenarios

#### Blocked Contacts

**Backend Behavior**: Notifications are skipped for blocked conversations, **except mentions**.

**Mobile Impact**: 
- Blocked conversation notifications won't appear in push or in-app list
- Mention notifications still appear (critical alerts)

#### Pending Conversations

**Backend Behavior**: Notifications are skipped for `pending` conversations (bot-handled).

**Mobile Impact**: 
- No notifications for pending conversations
- Only actionable (open) conversations trigger notifications

#### Duplicate Notification Prevention

**Backend Behavior**: If user is mentioned AND is assignee, only mention notification is created.

**Mobile Impact**: 
- Prevents duplicate notifications in list
- User sees only one notification per message

#### User Removed from Account

**Backend Behavior**: 
- Notification settings destroyed
- `NotificationBuilder` gracefully handles missing settings

**Mobile Impact**: 
- No new notifications received
- Existing notifications remain in list until deleted

#### Self-Assignment

**Backend Behavior**: Notifications are skipped for self-assignments.

**Mobile Impact**: 
- No notification when user assigns conversation to themselves

### Backend FCM Service Details

**Service**: `FcmService` (`app/services/notification/fcm_service.rb`)

**Features**:
- Google Service Account authentication
- OAuth token generation and caching
- Automatic token refresh on expiration
- Scoped to Firebase Messaging API

**Configuration Requirements**:
- `FIREBASE_PROJECT_ID`: Firebase project identifier
- `FIREBASE_CREDENTIALS`: JSON service account credentials

**Token Management**:
- Tokens cached in memory
- Automatically refreshed when expired
- Reduces authentication overhead

**Chatwoot Hub Relay** (Fallback):
- **Purpose**: Fallback when Firebase credentials not configured
- **Configuration**: `ENABLE_PUSH_RELAY_SERVER` (default: `true`)
- **URL**: `CHATWOOT_HUB_URL` (default: `https://hub.2.chatwoot.com`)
- **Use Case**: Community/self-hosted installations without Firebase setup
- **Flow**: Backend relays FCM requests to Chatwoot Hub, which handles delivery

**Mobile Impact**:
- Mobile app doesn't need to know about Hub relay
- FCM payload structure remains the same
- Delivery happens transparently

## Data Flow

### FCM Token Registration Flow

```
1. User logs in / App starts
   ↓
2. Presentation Layer: dispatch(saveDeviceDetails())
   ↓
3. Async Thunk (Presentation): Calls Use Case
   ↓
4. Use Case (Domain): RegisterDeviceUseCase.execute()
   ↓
5. Repository (Data): 
   ├─ Infrastructure: messaging().requestPermission()
   ├─ Infrastructure: messaging().getToken()
   └─ API: SettingsService.saveDeviceDetails(payload)
   ↓
6. Repository (Data): store.dispatch(updateDeviceToken(token))
   ↓
7. Infrastructure Layer: Redux state updated
   ↓
8. Presentation Layer: Component reads via selector
```

**Key Points**:
- Use Case (Domain) doesn't know about Redux
- Repository (Data) handles Redux dispatch
- Infrastructure provides state management
- Presentation reads reactively via selectors

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
3. Async Thunk (Presentation): Calls Use Case
   ↓
4. Use Case (Domain): FetchNotificationsUseCase.execute()
   ↓
5. Repository (Data): NotificationService.getNotifications()
   ├─ Infrastructure: APIService.get('/notifications')
   ├─ Data: Transform API response to domain entities
   └─ Infrastructure: store.dispatch(addNotificationsToStore(notifications))
   ↓
6. Infrastructure Layer: Redux state updated
   ↓
7. Presentation Layer: Component reads via selector (reactive update)
   ↓
8. UI: Notification list re-renders
```

**Key Points**:
- Use Case coordinates business logic
- Repository handles both API and Redux dispatch
- Redux is Infrastructure (state management)
- Components read reactively via selectors

### Real-Time Update Flow (Action Cable)

```
1. Backend: Notification created
   ↓
2. Infrastructure Layer: Action Cable receives 'notification.created' event
   ↓
3. Infrastructure Layer: Transform notification data
   ↓
4. Infrastructure Layer: store.dispatch(addNotificationsToStore([notification]))
   ↓
5. Infrastructure Layer: Redux state updated
   ↓
6. Infrastructure Layer: updateBadgeCount(unreadCount)
   ↓
7. Presentation Layer: Component reads via selector (reactive update)
   ↓
8. UI: Notification appears in list, badge updates
```

**Key Points**:
- Action Cable handler dispatches directly to Redux (Infrastructure)
- No use case needed for real-time updates (infrastructure concern)
- Components reactively update via selectors

---

## Key Files Reference

### Domain Layer

| File | Purpose |
|------|---------|
| `src/types/Notification.ts` | Notification entity and types |
| `src/constants/index.ts` | Domain constants (NOTIFICATION_TYPES) |

### Infrastructure Layer

| File | Purpose |
|------|---------|
| `src/store/notification/notificationService.ts` | Notification repository (dispatches to Redux) |
| `src/store/settings/settingsService.ts` | Device registration repository |
| `src/store/notification/notificationTypes.ts` | API response models |
| `src/store/settings/settingsTypes.ts` | Payload models |
| `src/utils/camelCaseKeys.ts` | Data transformation |

### Infrastructure Layer

| File | Purpose |
|------|---------|
| `src/store/index.ts` | Redux store configuration (state management) |
| `src/store/reducers.ts` | Redux root reducer |
| `src/store/notification/notificationSlice.ts` | Redux slice (minimal: save/delete operations) |
| `src/utils/pushUtils.ts` | FCM message parsing, deep link generation, badge management |
| `src/services/APIService.ts` | HTTP client |
| `src/utils/actionCable.ts` | WebSocket integration (dispatches to Redux) |
| `app.config.ts` | Platform configuration |
| `firebase.json` | Firebase settings |

### Presentation Layer

| File | Purpose |
|------|---------|
| `src/store/notification/notificationAction.ts` | Async thunks (thin coordinators) |
| `src/store/notification/notificationSelectors.ts` | Redux selectors (for components) |
| `src/store/settings/settingsActions.ts` | Device registration async thunks |
| `src/navigation/index.tsx` | Navigation and deep linking |
| `src/screens/inbox/InboxScreen.tsx` | Notification list UI (reads via selectors) |
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

The mobile push notification system follows Clean Architecture principles with **Redux as Infrastructure**:

1. **Domain Layer**: Pure business logic with entities, use cases, and interfaces (framework-independent)
2. **Infrastructure Layer**: Repositories that handle API calls and **dispatch to Redux**
3. **Infrastructure Layer**: Repositories, Transformers, Platform-specific implementations (FCM, Notifee, API, **Redux Store**)
4. **Presentation Layer**: UI components that **read from Redux** via selectors

### Key Architectural Patterns

**Redux as Infrastructure** (following [Clean Architecture with Redux](https://dev.to/juanoa/how-to-implement-redux-in-a-clean-architecture-1dcp)):
- **Redux = State Management Mechanism**: Like a database, not business logic
- **Repositories Dispatch**: Infrastructure Layer repositories handle Redux dispatch
- **Minimal Reducers**: Only "save" and "delete" operations
- **Use Cases Abstracted**: Domain layer doesn't know about Redux
- **Components Read Directly**: Presentation layer uses selectors for reactive UI

**Benefits**:
- **Framework Independence**: Use cases work without Redux
- **Easy to Swap**: Can replace Redux with Zustand, MobX, etc. (only change repositories)
- **Testability**: Business logic testable without Redux
- **Separation of Concerns**: Clear layer boundaries
- **Centralized Mutations**: All state changes in repositories

### Current Implementation Status

✅ **Implemented**:
- FCM token registration
- Notification reception (all app states)
- Deep linking
- Badge count management (iOS)
- Real-time updates (Action Cable)
- State management (Redux as Infrastructure)
- In-app notification list (InboxScreen)
- Notification preferences management

⚠️ **Refactoring Opportunity**:
- Move Redux dispatch from async thunks to repositories
- Create use cases for business logic
- Simplify reducers to only save/delete operations
- Abstract use cases from Redux knowledge

### System Architecture Summary

**Two Notification Systems**:

1. **Push Notifications (FCM)**:
   - System-level alerts in notification tray
   - Works when app is closed/backgrounded
   - Delivered via FCM HTTP v1 API
   - Deep link navigation on tap

2. **In-App Notifications**:
   - List displayed in `InboxScreen`
   - Fetched via API (`NotificationService`)
   - Updated in real-time via Action Cable
   - Full CRUD operations (read, unread, delete, snooze)

**Backend Integration**:
- Event-driven notification creation
- User preference validation before delivery
- Automatic subscription cleanup
- Real-time WebSocket broadcasts
- Efficient database queries with proper indexing

**Notification Types**: 8 types (5 OSS + 3 Enterprise SLA types)
- Each with specific triggers and behaviors
- User-configurable preferences
- Default settings per type

The system is production-ready and follows React Native and Clean Architecture best practices.
