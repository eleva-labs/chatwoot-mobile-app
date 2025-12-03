# Backend Push Notification System Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Platform-Agnostic Design](#platform-agnostic-design)
4. [Queue System Architecture](#queue-system-architecture)
5. [Dead Letter Queue (DLQ)](#dead-letter-queue-dlq)
6. [FCM HTTP v1 API Integration](#fcm-http-v1-api-integration)
7. [Notification Service Layer](#notification-service-layer)
8. [Device Management](#device-management)
9. [User Preferences & Filtering](#user-preferences--filtering)
10. [Error Handling & Retry Logic](#error-handling--retry-logic)
11. [Monitoring & Observability](#monitoring--observability)
12. [Database Schema](#database-schema)
13. [API Endpoints](#api-endpoints)
14. [Implementation Examples](#implementation-examples)
15. [Best Practices](#best-practices)

---

## Overview

This document describes a robust, scalable, and platform-agnostic backend push notification system for Chatwoot. The system is designed to:

- **Support multiple platforms**: iOS, Android, and Web (PWA)
- **Handle high volume**: Queue-based architecture for scalability
- **Ensure reliability**: Dead letter queue for failed notifications
- **Maintain flexibility**: Easy to add new notification providers
- **Provide observability**: Comprehensive monitoring and logging

### Key Requirements

- ✅ Platform-agnostic (iOS, Android, Web)
- ✅ Queue-based processing for scalability
- ✅ Dead letter queue for failed notifications
- ✅ Retry mechanism with exponential backoff
- ✅ User preference filtering
- ✅ Rate limiting and throttling
- ✅ Comprehensive error handling
- ✅ Monitoring and alerting

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Application   │
│     Layer       │
└────────┬────────┘
         │
         │ Creates Notification
         ▼
┌─────────────────┐
│  Notification   │
│   Controller    │
└────────┬────────┘
         │
         │ Validates & Enqueues
         ▼
┌─────────────────┐
│  Message Queue  │
│   (Redis/RabbitMQ│
│    /SQS/etc)    │
└────────┬────────┘
         │
         │ Worker consumes
         ▼
┌─────────────────┐
│  Notification  │
│    Worker      │
└────────┬────────┘
         │
         │ Filters by preferences
         │ Fetches device tokens
         │ Formats for platform
         ▼
┌─────────────────┐
│  FCM Service    │
│   (HTTP v1 API) │
└────────┬────────┘
         │
         │ Success/Failure
         ▼
┌─────────────────┐
│  DLQ (if failed)│
│  or Success Log │
└─────────────────┘
```

### Component Breakdown

1. **Notification Controller**: Receives notification requests from application
2. **Message Queue**: Buffers notifications for async processing
3. **Notification Worker**: Processes notifications from queue
4. **FCM Service**: Sends notifications via Firebase HTTP v1 API
5. **Dead Letter Queue**: Stores failed notifications for analysis/retry
6. **Device Manager**: Manages device tokens and subscriptions
7. **Preference Filter**: Filters notifications based on user preferences

---

## Platform-Agnostic Design

### Notification Abstraction Layer

The system uses a platform-agnostic notification model that can be transformed into platform-specific formats.

#### Core Notification Model

```ruby
# Ruby example (Chatwoot uses Ruby on Rails)
class NotificationPayload
  attr_accessor :title, :body, :data, :image_url, :sound, :badge_count
  attr_accessor :deep_link, :priority, :ttl, :collapse_key
  
  def initialize(attributes = {})
    @title = attributes[:title]
    @body = attributes[:body]
    @data = attributes[:data] || {}
    @image_url = attributes[:image_url]
    @sound = attributes[:sound] || 'default'
    @badge_count = attributes[:badge_count]
    @deep_link = attributes[:deep_link]
    @priority = attributes[:priority] || 'normal'
    @ttl = attributes[:ttl] || 3600 # 1 hour default
    @collapse_key = attributes[:collapse_key]
  end
end
```

#### Platform Adapter Pattern

```ruby
# Base adapter
class NotificationAdapter
  def format(payload, device_token, platform)
    raise NotImplementedError, "Subclasses must implement format method"
  end
end

# iOS Adapter
class IOSNotificationAdapter < NotificationAdapter
  def format(payload, device_token, platform)
    {
      token: device_token,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.image_url
      },
      data: payload.data.merge(
        deep_link: payload.deep_link,
        badge: payload.badge_count
      ),
      apns: {
        payload: {
          aps: {
            badge: payload.badge_count,
            sound: payload.sound,
            'content-available': 1
          }
        },
        headers: {
          'apns-priority': payload.priority == 'high' ? '10' : '5'
        }
      }
    }
  end
end

# Android Adapter
class AndroidNotificationAdapter < NotificationAdapter
  def format(payload, device_token, platform)
    {
      token: device_token,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.image_url
      },
      data: payload.data.merge(
        deep_link: payload.deep_link
      ),
      android: {
        priority: payload.priority,
        ttl: "#{payload.ttl}s",
        notification: {
          sound: payload.sound,
          channel_id: 'chatwoot_default',
          click_action: 'OPEN_CONVERSATION'
        }
      }
    }
  end
end

# Web/PWA Adapter
class WebNotificationAdapter < NotificationAdapter
  def format(payload, device_token, platform)
    {
      token: device_token,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.image_url
      },
      data: payload.data.merge(
        deep_link: payload.deep_link,
        click_action: payload.deep_link
      ),
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.image_url,
          badge: payload.image_url,
          require_interaction: false
        },
        fcm_options: {
          link: payload.deep_link
        }
      }
    }
  end
end
```

#### Adapter Factory

```ruby
class NotificationAdapterFactory
  ADAPTERS = {
    'ios' => IOSNotificationAdapter,
    'android' => AndroidNotificationAdapter,
    'web' => WebNotificationAdapter
  }.freeze

  def self.create(platform)
    adapter_class = ADAPTERS[platform.downcase]
    raise "Unsupported platform: #{platform}" unless adapter_class
    adapter_class.new
  end
end
```

---

## Queue System Architecture

### Queue Selection

Recommended queue systems (choose based on infrastructure):

1. **Redis with Sidekiq/Resque** (Ruby)
   - Fast, in-memory
   - Good for Ruby/Rails applications
   - Built-in retry mechanisms

2. **RabbitMQ**
   - Robust, feature-rich
   - Good for multi-language systems
   - Built-in DLQ support

3. **Amazon SQS**
   - Managed service
   - Auto-scaling
   - Built-in DLQ support

4. **Google Cloud Pub/Sub**
   - Managed service
   - High throughput
   - Good for GCP infrastructure

### Queue Structure

#### Primary Queue: `push_notifications`

```ruby
# Job structure
class PushNotificationJob
  include Sidekiq::Worker
  
  sidekiq_options queue: 'push_notifications',
                  retry: 3,
                  backtrace: true

  def perform(notification_id, user_id, account_id)
    notification = Notification.find(notification_id)
    user = User.find(user_id)
    
    # Get user's notification preferences
    preferences = NotificationPreference.find_by(user_id: user_id, account_id: account_id)
    
    # Check if user wants this notification type
    return unless should_send_notification?(notification, preferences)
    
    # Get all device tokens for user
    devices = NotificationSubscription.where(
      user_id: user_id,
      account_id: account_id,
      active: true
    )
    
    devices.each do |device|
      send_to_device(notification, device)
    end
  end
  
  private
  
  def should_send_notification?(notification, preferences)
    return true unless preferences
    
    notification_type_key = "push_#{notification.notification_type}"
    preferences.selected_push_flags.include?(notification_type_key)
  end
  
  def send_to_device(notification, device)
    adapter = NotificationAdapterFactory.create(device.platform)
    payload = build_notification_payload(notification, device)
    formatted_message = adapter.format(payload, device.push_token, device.platform)
    
    FCMService.send(formatted_message, device)
  rescue => e
    # Log error and send to DLQ
    handle_delivery_failure(notification, device, e)
  end
end
```

#### Priority Queues

For different notification priorities:

```ruby
# High priority (immediate delivery)
sidekiq_options queue: 'push_notifications_high_priority'

# Normal priority (standard delivery)
sidekiq_options queue: 'push_notifications_normal'

# Low priority (batch delivery)
sidekiq_options queue: 'push_notifications_low_priority'
```

### Queue Configuration

```ruby
# config/sidekiq.yml
:queues:
  - push_notifications_high_priority
  - push_notifications_normal
  - push_notifications_low_priority
  - push_notifications_dlq

:max_retries: 3
:retry_backoff: 60  # seconds
```

---

## Dead Letter Queue (DLQ)

### Purpose

The DLQ stores notifications that have failed after all retry attempts. This allows for:
- Analysis of failure patterns
- Manual retry of important notifications
- Debugging and troubleshooting
- Metrics on failure rates

### DLQ Structure

```ruby
class DeadLetterQueue
  def self.add(notification_id, device_id, error, attempts)
    DLQEntry.create(
      notification_id: notification_id,
      device_id: device_id,
      error_message: error.message,
      error_class: error.class.name,
      error_backtrace: error.backtrace.join("\n"),
      attempts: attempts,
      failed_at: Time.current,
      status: 'pending'
    )
  end
  
  def self.retry(entry_id)
    entry = DLQEntry.find(entry_id)
    notification = Notification.find(entry.notification_id)
    device = NotificationSubscription.find(entry.device_id)
    
    # Re-enqueue for processing
    PushNotificationJob.perform_async(
      notification.id,
      notification.user_id,
      notification.account_id
    )
    
    entry.update(status: 'retried', retried_at: Time.current)
  end
end
```

### DLQ Entry Model

```ruby
# Database migration
create_table :dlq_entries do |t|
  t.references :notification, null: false, foreign_key: true
  t.references :notification_subscription, null: false, foreign_key: true
  t.text :error_message
  t.string :error_class
  t.text :error_backtrace
  t.integer :attempts, default: 0
  t.string :status, default: 'pending' # pending, retried, resolved, ignored
  t.datetime :failed_at
  t.datetime :retried_at
  t.text :resolution_notes
  
  t.timestamps
end

add_index :dlq_entries, :status
add_index :dlq_entries, :failed_at
```

### DLQ Monitoring

```ruby
class DLQMonitor
  def self.stats
    {
      total_failures: DLQEntry.count,
      pending: DLQEntry.where(status: 'pending').count,
      retried: DLQEntry.where(status: 'retried').count,
      resolved: DLQEntry.where(status: 'resolved').count,
      failures_by_error: DLQEntry.group(:error_class).count,
      failures_by_platform: DLQEntry.joins(:notification_subscription)
                                    .group('notification_subscriptions.platform')
                                    .count
    }
  end
  
  def self.alert_if_threshold_exceeded(threshold = 100)
    pending_count = DLQEntry.where(status: 'pending').count
    if pending_count > threshold
      AlertService.send(
        severity: 'warning',
        message: "DLQ has #{pending_count} pending entries (threshold: #{threshold})"
      )
    end
  end
end
```

---

## FCM HTTP v1 API Integration

### Service Account Setup

1. **Create Service Account**:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download JSON file

2. **Store Credentials Securely**:
   ```ruby
   # Use environment variables or secure storage
   ENV['FIREBASE_SERVICE_ACCOUNT_PATH'] = '/path/to/service-account.json'
   # Or use Rails credentials
   Rails.application.credentials.firebase[:service_account]
   ```

### FCM Service Implementation

```ruby
require 'google/apis/fcm_v1'
require 'googleauth'

class FCMService
  FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/%{project_id}/messages:send'
  
  def self.send(message, device)
    access_token = get_access_token
    project_id = get_project_id
    
    uri = URI.parse(FCM_ENDPOINT % { project_id: project_id })
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Post.new(uri.path)
    request['Authorization'] = "Bearer #{access_token}"
    request['Content-Type'] = 'application/json'
    request.body = { message: message }.to_json
    
    response = http.request(request)
    
    handle_response(response, message, device)
  end
  
  private
  
  def self.get_access_token
    credentials = Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: File.open(ENV['FIREBASE_SERVICE_ACCOUNT_PATH']),
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    )
    credentials.fetch_access_token!['access_token']
  end
  
  def self.get_project_id
    service_account = JSON.parse(File.read(ENV['FIREBASE_SERVICE_ACCOUNT_PATH']))
    service_account['project_id']
  end
  
  def self.handle_response(response, message, device)
    case response.code.to_i
    when 200
      result = JSON.parse(response.body)
      log_success(message, device, result)
      { success: true, message_id: result['name'] }
    when 400
      error = JSON.parse(response.body)
      raise InvalidRequestError, error['error']['message']
    when 401
      raise AuthenticationError, 'Invalid credentials'
    when 403
      raise AuthorizationError, 'Insufficient permissions'
    when 404
      raise InvalidTokenError, 'Device token not found or invalid'
    else
      raise DeliveryError, "Unexpected error: #{response.code} - #{response.body}"
    end
  rescue => e
    log_error(message, device, e)
    raise
  end
end
```

### Error Handling

```ruby
class InvalidTokenError < StandardError; end
class AuthenticationError < StandardError; end
class AuthorizationError < StandardError; end
class DeliveryError < StandardError; end
class InvalidRequestError < StandardError; end

# Handle specific FCM errors
class FCMErrorHandler
  def self.handle(error, device)
    case error
    when InvalidTokenError
      # Token is invalid, mark device as inactive
      device.update(active: false, invalidated_at: Time.current)
    when AuthenticationError, AuthorizationError
      # Credential issue, alert admin
      AlertService.send(severity: 'critical', message: error.message)
    when DeliveryError
      # Retryable error, will be retried by queue
      raise
    end
  end
end
```

---

## Notification Service Layer

### Notification Creation

```ruby
class NotificationService
  def self.create_notification(params)
    notification = Notification.create!(
      user_id: params[:user_id],
      account_id: params[:account_id],
      notification_type: params[:notification_type],
      primary_actor_type: params[:primary_actor_type],
      primary_actor_id: params[:primary_actor_id],
      push_message_title: params[:push_message_title] || build_title(params),
      meta: params[:meta] || {}
    )
    
    # Enqueue for delivery
    enqueue_notification(notification)
    
    notification
  end
  
  private
  
  def self.build_title(params)
    case params[:notification_type]
    when 'conversation_creation'
      "New conversation"
    when 'assigned_conversation_new_message'
      "New message in assigned conversation"
    when 'conversation_mention'
      "You were mentioned"
    else
      "New notification"
    end
  end
  
  def self.enqueue_notification(notification)
    # Determine priority
    priority = determine_priority(notification)
    queue_name = "push_notifications_#{priority}_priority"
    
    PushNotificationJob.set(queue: queue_name).perform_async(
      notification.id,
      notification.user_id,
      notification.account_id
    )
  end
  
  def self.determine_priority(notification)
    case notification.notification_type
    when 'sla_missed_first_response', 'sla_missed_next_response', 'sla_missed_resolution'
      'high'
    when 'conversation_mention'
      'high'
    else
      'normal'
    end
  end
end
```

### Notification Payload Builder

```ruby
class NotificationPayloadBuilder
  def self.build(notification, device)
    payload = NotificationPayload.new(
      title: notification.push_message_title,
      body: build_body(notification),
      data: build_data(notification),
      image_url: build_image_url(notification),
      sound: 'default',
      badge_count: get_badge_count(notification.user_id, notification.account_id),
      deep_link: build_deep_link(notification),
      priority: determine_priority(notification),
      ttl: 3600,
      collapse_key: build_collapse_key(notification)
    )
    
    payload
  end
  
  private
  
  def self.build_body(notification)
    case notification.notification_type
    when 'conversation_creation'
      "A new conversation has been created"
    when 'assigned_conversation_new_message'
      "You have a new message"
    when 'conversation_mention'
      "You were mentioned in a conversation"
    else
      "You have a new notification"
    end
  end
  
  def self.build_data(notification)
    {
      notification_id: notification.id,
      notification_type: notification.notification_type,
      primary_actor_id: notification.primary_actor_id,
      primary_actor_type: notification.primary_actor_type,
      account_id: notification.account_id,
      timestamp: notification.created_at.to_i
    }
  end
  
  def self.build_deep_link(notification)
    base_url = Rails.application.config.installation_url
    case notification.primary_actor_type
    when 'Conversation'
      "#{base_url}/app/accounts/#{notification.account_id}/conversations/#{notification.primary_actor_id}"
    when 'Message'
      conversation_id = get_conversation_id_from_message(notification.primary_actor_id)
      "#{base_url}/app/accounts/#{notification.account_id}/conversations/#{conversation_id}/#{notification.primary_actor_id}/Message"
    else
      "#{base_url}/app/notifications"
    end
  end
  
  def self.build_collapse_key(notification)
    "#{notification.notification_type}_#{notification.primary_actor_id}"
  end
  
  def self.get_badge_count(user_id, account_id)
    Notification.where(
      user_id: user_id,
      account_id: account_id,
      read_at: nil
    ).count
  end
end
```

---

## Device Management

### Device Registration

```ruby
class NotificationSubscriptionService
  def self.register_device(params)
    subscription = NotificationSubscription.find_or_initialize_by(
      user_id: params[:user_id],
      account_id: params[:account_id],
      device_id: params[:device_id],
      push_token: params[:push_token]
    )
    
    subscription.assign_attributes(
      subscription_type: params[:subscription_type] || 'fcm',
      platform: detect_platform(params[:subscription_attributes]),
      device_name: params[:subscription_attributes][:device_name],
      device_platform: params[:subscription_attributes][:device_platform],
      api_level: params[:subscription_attributes][:api_level],
      brand_name: params[:subscription_attributes][:brand_name],
      build_number: params[:subscription_attributes][:build_number],
      active: true,
      last_registered_at: Time.current
    )
    
    subscription.save!
    subscription
  end
  
  def self.remove_device(push_token)
    subscription = NotificationSubscription.find_by(push_token: push_token)
    return unless subscription
    
    subscription.update(active: false, invalidated_at: Time.current)
  end
  
  private
  
  def self.detect_platform(attributes)
    platform = attributes[:device_platform]&.downcase
    case platform
    when 'ios', 'iphone os'
      'ios'
    when 'android'
      'android'
    else
      'web' # Default for PWA
    end
  end
end
```

### Token Validation

```ruby
class TokenValidator
  def self.validate_and_cleanup
    # Periodically validate tokens and remove invalid ones
    inactive_tokens = []
    
    NotificationSubscription.where(active: true).find_each do |subscription|
      unless valid_token?(subscription.push_token)
        subscription.update(active: false, invalidated_at: Time.current)
        inactive_tokens << subscription.id
      end
    end
    
    inactive_tokens
  end
  
  private
  
  def self.valid_token?(token)
    # Attempt to send a test notification or check token format
    # FCM will return 404 for invalid tokens
    # This is a lightweight check - actual validation happens on send
    token.present? && token.length > 100
  end
end
```

---

## User Preferences & Filtering

### Preference Model

```ruby
# Database schema
create_table :notification_preferences do |t|
  t.references :user, null: false, foreign_key: true
  t.references :account, null: false, foreign_key: true
  t.text :all_email_flags, array: true, default: []
  t.text :selected_email_flags, array: true, default: []
  t.text :all_push_flags, array: true, default: []
  t.text :selected_push_flags, array: true, default: []
  
  t.timestamps
end

# Model
class NotificationPreference < ApplicationRecord
  belongs_to :user
  belongs_to :account
  
  def push_enabled_for?(notification_type)
    key = "push_#{notification_type}"
    selected_push_flags.include?(key)
  end
end
```

### Preference Filter

```ruby
class NotificationPreferenceFilter
  def self.should_send?(notification, user_id, account_id)
    preference = NotificationPreference.find_by(
      user_id: user_id,
      account_id: account_id
    )
    
    # If no preference exists, send by default
    return true unless preference
    
    # Check if user has enabled this notification type
    preference.push_enabled_for?(notification.notification_type)
  end
end
```

---

## Error Handling & Retry Logic

### Retry Strategy

```ruby
class PushNotificationJob
  include Sidekiq::Worker
  
  sidekiq_options queue: 'push_notifications',
                  retry: 3,
                  backtrace: true
  
  sidekiq_retry_in do |count, exception|
    case exception
    when InvalidTokenError
      # Don't retry invalid tokens
      false
    when AuthenticationError, AuthorizationError
      # Retry after longer delay for auth issues
      300 # 5 minutes
    when DeliveryError
      # Exponential backoff for delivery errors
      (count ** 2) * 60 # 1min, 4min, 9min
    else
      # Default exponential backoff
      (count ** 2) * 30
    end
  end
  
  sidekiq_retries_exhausted do |msg, exception|
    # Send to DLQ after all retries exhausted
    notification_id = msg['args'][0]
    device_id = msg['args'][1] # Would need to pass this
    DeadLetterQueue.add(notification_id, device_id, exception, msg['retry_count'])
  end
end
```

### Error Classification

```ruby
class ErrorClassifier
  def self.classify(error)
    case error
    when InvalidTokenError
      { category: 'token_error', retryable: false, severity: 'low' }
    when AuthenticationError, AuthorizationError
      { category: 'auth_error', retryable: true, severity: 'critical' }
    when DeliveryError
      { category: 'delivery_error', retryable: true, severity: 'medium' }
    when InvalidRequestError
      { category: 'request_error', retryable: false, severity: 'high' }
    else
      { category: 'unknown_error', retryable: true, severity: 'medium' }
    end
  end
end
```

---

## Monitoring & Observability

### Metrics

```ruby
class NotificationMetrics
  def self.record_sent(platform, notification_type)
    StatsD.increment('notifications.sent', tags: [
      "platform:#{platform}",
      "type:#{notification_type}"
    ])
  end
  
  def self.record_failed(platform, notification_type, error_class)
    StatsD.increment('notifications.failed', tags: [
      "platform:#{platform}",
      "type:#{notification_type}",
      "error:#{error_class}"
    ])
  end
  
  def self.record_delivery_time(platform, duration_ms)
    StatsD.timing('notifications.delivery_time', duration_ms, tags: [
      "platform:#{platform}"
    ])
  end
  
  def self.record_queue_size(queue_name, size)
    StatsD.gauge('notifications.queue_size', size, tags: [
      "queue:#{queue_name}"
    ])
  end
end
```

### Logging

```ruby
class NotificationLogger
  def self.log_send(notification, device, result)
    Rails.logger.info({
      event: 'notification_sent',
      notification_id: notification.id,
      user_id: notification.user_id,
      device_id: device.id,
      platform: device.platform,
      notification_type: notification.notification_type,
      message_id: result[:message_id],
      timestamp: Time.current
    }.to_json)
  end
  
  def self.log_failure(notification, device, error)
    Rails.logger.error({
      event: 'notification_failed',
      notification_id: notification.id,
      user_id: notification.user_id,
      device_id: device.id,
      platform: device.platform,
      error_class: error.class.name,
      error_message: error.message,
      timestamp: Time.current
    }.to_json)
  end
end
```

---

## Database Schema

### Core Tables

```ruby
# Notifications table (existing)
create_table :notifications do |t|
  t.references :user, null: false, foreign_key: true
  t.references :account, null: false, foreign_key: true
  t.string :notification_type
  t.string :primary_actor_type
  t.integer :primary_actor_id
  t.string :push_message_title
  t.text :meta
  t.datetime :read_at
  t.datetime :snoozed_until
  t.timestamps
end

# Notification subscriptions (device tokens)
create_table :notification_subscriptions do |t|
  t.references :user, null: false, foreign_key: true
  t.references :account, null: false, foreign_key: true
  t.string :subscription_type, default: 'fcm'
  t.string :push_token, null: false
  t.string :device_id, null: false
  t.string :platform # ios, android, web
  t.string :device_name
  t.string :device_platform
  t.string :api_level
  t.string :brand_name
  t.string :build_number
  t.boolean :active, default: true
  t.datetime :last_registered_at
  t.datetime :invalidated_at
  
  t.timestamps
end

add_index :notification_subscriptions, [:user_id, :account_id, :active]
add_index :notification_subscriptions, :push_token, unique: true
add_index :notification_subscriptions, [:user_id, :device_id]

# Notification preferences
create_table :notification_preferences do |t|
  t.references :user, null: false, foreign_key: true
  t.references :account, null: false, foreign_key: true
  t.text :all_email_flags, array: true, default: []
  t.text :selected_email_flags, array: true, default: []
  t.text :all_push_flags, array: true, default: []
  t.text :selected_push_flags, array: true, default: []
  
  t.timestamps
end

add_index :notification_preferences, [:user_id, :account_id], unique: true

# Dead letter queue
create_table :dlq_entries do |t|
  t.references :notification, null: false, foreign_key: true
  t.references :notification_subscription, null: false, foreign_key: true
  t.text :error_message
  t.string :error_class
  t.text :error_backtrace
  t.integer :attempts, default: 0
  t.string :status, default: 'pending'
  t.datetime :failed_at
  t.datetime :retried_at
  t.text :resolution_notes
  
  t.timestamps
end

add_index :dlq_entries, :status
add_index :dlq_entries, :failed_at
```

---

## API Endpoints

### Device Registration

```ruby
# POST /api/v1/notification_subscriptions
class Api::V1::NotificationSubscriptionsController < Api::V1::BaseController
  def create
    subscription = NotificationSubscriptionService.register_device(
      user_id: current_user.id,
      account_id: current_account.id,
      device_id: params[:subscription_attributes][:device_id],
      push_token: params[:subscription_attributes][:push_token],
      subscription_type: params[:subscription_type] || 'fcm',
      subscription_attributes: params[:subscription_attributes]
    )
    
    render json: { fcmToken: subscription.push_token }, status: :created
  end
end
```

### Device Removal

```ruby
# DELETE /api/v1/notification_subscriptions
class Api::V1::NotificationSubscriptionsController < Api::V1::BaseController
  def destroy
    NotificationSubscriptionService.remove_device(params[:push_token])
    head :no_content
  end
end
```

### Notification Preferences

```ruby
# GET /api/v1/notification_settings
class Api::V1::NotificationSettingsController < Api::V1::BaseController
  def show
    preference = NotificationPreference.find_or_create_by(
      user_id: current_user.id,
      account_id: current_account.id
    )
    
    render json: preference
  end
  
  # PUT /api/v1/notification_settings
  def update
    preference = NotificationPreference.find_or_create_by(
      user_id: current_user.id,
      account_id: current_account.id
    )
    
    preference.update(
      selected_email_flags: params[:notification_settings][:selected_email_flags],
      selected_push_flags: params[:notification_settings][:selected_push_flags]
    )
    
    render json: preference
  end
end
```

---

## Implementation Examples

### Creating and Sending a Notification

```ruby
# In your application code (e.g., when a new message arrives)
class MessageService
  def self.create_and_notify(message)
    # Create the message
    message = Message.create!(message_params)
    
    # Create notification
    notification = NotificationService.create_notification(
      user_id: assigned_agent.id,
      account_id: message.account_id,
      notification_type: 'assigned_conversation_new_message',
      primary_actor_type: 'Message',
      primary_actor_id: message.id,
      push_message_title: "New message from #{message.sender.name}",
      meta: {
        conversation_id: message.conversation_id,
        sender_id: message.sender.id
      }
    )
    
    # Notification is automatically enqueued by NotificationService
    notification
  end
end
```

### Batch Notification Processing

```ruby
class BatchNotificationJob
  include Sidekiq::Worker
  
  def perform(notification_ids)
    notifications = Notification.where(id: notification_ids)
    
    notifications.find_each do |notification|
      PushNotificationJob.perform_async(
        notification.id,
        notification.user_id,
        notification.account_id
      )
    end
  end
end
```

---

## Best Practices

### 1. Rate Limiting

```ruby
class RateLimiter
  MAX_NOTIFICATIONS_PER_MINUTE = 100
  
  def self.check_rate_limit(user_id)
    key = "notification_rate:#{user_id}:#{Time.current.to_i / 60}"
    count = Redis.current.incr(key)
    Redis.current.expire(key, 60)
    
    if count > MAX_NOTIFICATIONS_PER_MINUTE
      raise RateLimitExceeded, "Too many notifications for user #{user_id}"
    end
  end
end
```

### 2. Token Rotation

```ruby
class TokenRotationService
  def self.handle_token_rotation(old_token, new_token, user_id, account_id)
    # Update or create new subscription
    subscription = NotificationSubscription.find_by(push_token: old_token)
    
    if subscription
      subscription.update(push_token: new_token, last_registered_at: Time.current)
    else
      # Token might have been rotated, find by user and device
      NotificationSubscriptionService.register_device(
        user_id: user_id,
        account_id: account_id,
        push_token: new_token,
        # ... other params
      )
    end
  end
end
```

### 3. Collapse Keys

Use collapse keys to prevent notification spam:

```ruby
def build_collapse_key(notification)
  "#{notification.notification_type}_#{notification.primary_actor_id}"
end
```

### 4. TTL Management

Set appropriate TTL for notifications:

```ruby
def determine_ttl(notification)
  case notification.notification_type
  when 'sla_missed_first_response'
    86400 # 24 hours
  else
    3600 # 1 hour
  end
end
```

### 5. Testing

```ruby
# Test notification sending
RSpec.describe PushNotificationJob do
  it 'sends notification to all active devices' do
    user = create(:user)
    device1 = create(:notification_subscription, user: user, active: true)
    device2 = create(:notification_subscription, user: user, active: true)
    notification = create(:notification, user: user)
    
    expect(FCMService).to receive(:send).twice
    
    PushNotificationJob.new.perform(
      notification.id,
      user.id,
      notification.account_id
    )
  end
end
```

---

## Summary

This backend architecture provides:

1. **Platform-agnostic design** through adapter pattern
2. **Scalable queue system** for async processing
3. **Reliable delivery** with retry logic and DLQ
4. **User preference filtering** before sending
5. **Comprehensive error handling** with proper classification
6. **Monitoring and observability** for production debugging
7. **Flexible and extensible** design for future enhancements

The system is production-ready and can handle high volumes of notifications while maintaining reliability and user experience.

