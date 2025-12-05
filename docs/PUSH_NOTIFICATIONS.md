# Push Notifications Feature (Web Push)

## Overview

This document outlines the design and implementation plan for adding Web Push notification support to TrakrLog. When an event is tracked, users can receive real-time push notifications in their web browsers, even when the browser is closed or minimized.

**Note**: This implementation focuses exclusively on Web Push (browser notifications) to keep the system simple and maintainable. Mobile app notifications (FCM/APNS) are not in scope.

## Why Web Push?

- **Works When Browser is Closed**: Notifications delivered even when dashboard isn't open
- **Critical Alerts**: Perfect for production errors and important events
- **Standard Protocol**: Uses Web Push Protocol (RFC 8030) with VAPID
- **Wide Browser Support**: Chrome, Firefox, Edge, Safari (modern versions)
- **User Control**: Users explicitly opt-in via browser permissions
- **Persistent**: Subscriptions persist across sessions

**Trade-off**: Requires more setup (VAPID keys, service workers, browser permissions) but provides true push notifications that work 24/7.

## Use Cases

- **Critical Error Alerts**: Get immediately notified when critical bugs or errors occur in production
- **Important Events**: Receive alerts for high-priority events (purchases, signups, deployments)
- **Channel-Specific Notifications**: Subscribe to notifications from specific channels
- **Custom Filtering**: Configure which events trigger notifications based on tags, titles, or severity

## Architecture Overview

```
Event Tracked → Event Service → Notification Service → Push Service → Browser Push Service → User Device
```

## System Flow

### 1. Event Creation Flow with Notifications

```
Client/SDK
   ↓
POST /api/track (with event data)
   ↓
EventHandler.CreateEvent()
   ↓
EventService.CreateEvent()
   ↓ (event created)
   ↓
NotificationService.ProcessEventNotification()
   ↓
[Build notification payload]
   ↓
PushService.SendNotification()
   ↓
Browser Push Service (FCM, Mozilla Push, etc.)
   ↓
Service Worker receives push
   ↓
Browser displays notification
```

### 2. Subscription Flow

```
User opens Dashboard
   ↓
Frontend requests notification permission
   ↓
Browser shows permission prompt
   ↓
User grants permission
   ↓
Register service worker
   ↓
Subscribe to push manager with VAPID public key
   ↓
Get subscription object (endpoint, keys)
   ↓
POST /api/notifications/subscriptions
   ↓
Server stores subscription in database
   ↓
Subscription active, ready to receive notifications
```

### 3. Notification Behavior

In the initial implementation, **all events trigger notifications** for users who have active subscriptions. This keeps the system simple and ensures users never miss important events.

**Future Enhancement**: Notification rules will be added in Phase 2 to allow filtering by project, channel, tags, or keywords.

## Data Models

### NotificationSubscription

Stores user's browser push subscription information.

```go
type NotificationSubscription struct {
    ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    UserID       primitive.ObjectID `bson:"user_id" json:"userId"`
    Endpoint     string             `bson:"endpoint" json:"endpoint"`       // Web Push endpoint URL
    P256dh       string             `bson:"p256dh" json:"p256dh"`           // Public key for encryption
    Auth         string             `bson:"auth" json:"auth"`               // Auth secret for encryption
    UserAgent    string             `bson:"user_agent,omitempty" json:"userAgent,omitempty"`
    Enabled      bool               `bson:"enabled" json:"enabled"`
    CreatedAt    time.Time          `bson:"created_at" json:"createdAt"`
    UpdatedAt    time.Time          `bson:"updated_at" json:"updatedAt"`
    LastUsedAt   *time.Time         `bson:"last_used_at,omitempty" json:"lastUsedAt,omitempty"`
}
```

### NotificationLog

Tracks sent notifications for debugging and analytics.

```go
type NotificationLog struct {
    ID             primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
    UserID         primitive.ObjectID  `bson:"user_id" json:"userId"`
    EventID        primitive.ObjectID  `bson:"event_id" json:"eventId"`
    SubscriptionID primitive.ObjectID  `bson:"subscription_id" json:"subscriptionId"`
    Status         string              `bson:"status" json:"status"` // "sent", "failed"
    Error          string              `bson:"error,omitempty" json:"error,omitempty"`
    SentAt         time.Time           `bson:"sent_at" json:"sentAt"`
}
```

## Implementation Components

### 1. Notification Service

**Location**: `internal/service/notification.go`

Responsibilities:
- Evaluate notification rules for incoming events
- Manage notification throttling
- Coordinate with push service to deliver notifications
- Log notification delivery attempts

```go
type NotificationService struct {
    subscriptionRepo repository.NotificationSubscriptionRepository
    logRepo          repository.NotificationLogRepository
    pushService      *PushService
}

// Key methods:
func (s *NotificationService) ProcessEventNotification(ctx context.Context, event *model.Event, userID primitive.ObjectID) error
func (s *NotificationService) SendToAllSubscriptions(ctx context.Context, userID primitive.ObjectID, payload *NotificationPayload) error
```

### 2. Push Service

**Location**: `internal/service/push.go`

Responsibilities:
- Send Web Push notifications using VAPID
- Handle payload formatting and encryption
- Retry logic for failed deliveries
- Track delivery status

```go
type PushService struct {
    vapidPublicKey  string
    vapidPrivateKey string
    vapidSubject    string
}

// Key methods:
func (s *PushService) SendNotification(ctx context.Context, subscription *model.NotificationSubscription, payload *NotificationPayload) error
func (s *PushService) ValidateSubscription(subscription *model.NotificationSubscription) error
```

### 3. Notification Handlers

**Location**: `internal/handler/notification.go`

REST API endpoints:

```go
// Subscription management
POST   /api/notifications/subscriptions          - Create new push subscription
GET    /api/notifications/subscriptions          - List user's subscriptions
DELETE /api/notifications/subscriptions/:id      - Remove subscription
PATCH  /api/notifications/subscriptions/:id      - Update subscription (enable/disable)

// Testing & logs
POST   /api/notifications/test                   - Send test notification
GET    /api/notifications/logs                   - Get notification delivery logs (optional)
```

### 4. Repositories

**Location**: `internal/repository/notification.go`

```go
type NotificationSubscriptionRepository interface {
    Create(ctx context.Context, subscription *model.NotificationSubscription) error
    FindByID(ctx context.Context, id string) (*model.NotificationSubscription, error)
    FindByUserID(ctx context.Context, userID string) ([]*model.NotificationSubscription, error)
    Update(ctx context.Context, subscription *model.NotificationSubscription) error
    Delete(ctx context.Context, id string) error
    FindActiveByUserID(ctx context.Context, userID string) ([]*model.NotificationSubscription, error)
}

type NotificationLogRepository interface {
    Create(ctx context.Context, log *model.NotificationLog) error
    FindByUserID(ctx context.Context, userID string, limit, offset int64) ([]*model.NotificationLog, error)
    FindByEventID(ctx context.Context, eventID string) ([]*model.NotificationLog, error)
}
```

## Web Push Integration

### Overview

Web Push uses the Web Push Protocol (RFC 8030) with VAPID (Voluntary Application Server Identification) for authentication.

- **Library**: `github.com/SherClockHolmes/webpush-go`
- **Supports**: Chrome, Firefox, Edge, Safari (macOS 13+ and iOS 16.4+)
- **Protocol**: Messages are encrypted end-to-end using the subscription's public key

### VAPID Setup

VAPID keys are used to identify the application server to push services.

**Generate VAPID Keys**:

```bash
# Using web-push CLI (npm)
npm install -g web-push
web-push generate-vapid-keys

# Or use Go library
package main

import (
    "fmt"
    webpush "github.com/SherClockHolmes/webpush-go"
)

func main() {
    privateKey, publicKey, err := webpush.GenerateVAPIDKeys()
    if err != nil {
        panic(err)
    }
    fmt.Println("Public Key:", publicKey)
    fmt.Println("Private Key:", privateKey)
}
```

**Configuration**:
1. Generate VAPID key pair (one time)
2. Store private key securely in environment variables
3. Share public key with frontend (can be public)
4. Set subject to `mailto:` email or your domain URL

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Versions 50+ |
| Firefox | ✅ Full | Versions 44+ |
| Edge | ✅ Full | Chromium-based |
| Safari | ✅ Full | macOS 13+, iOS 16.4+ |
| Opera | ✅ Full | Chromium-based |

## Notification Payload Structure

```json
{
  "title": "New Event: Server Error",
  "body": "Database connection failed in production-api",
  "icon": "🔴",
  "data": {
    "eventId": "674f8a1b2c9d3e4f5a6b7c8d",
    "projectId": "674f8a1b2c9d3e4f5a6b7c8e",
    "channelId": "674f8a1b2c9d3e4f5a6b7c8f",
    "projectName": "my-saas-app",
    "channelName": "errors",
    "url": "/app/projects/my-saas-app/channels/errors/events/674f8a1b2c9d3e4f5a6b7c8d",
    "timestamp": "2025-12-04T10:30:00Z"
  },
  "tag": "trakrlog-event",
  "requireInteraction": false
}
```

## Configuration

Add to `.env`:

```bash
# Push Notifications
PUSH_NOTIFICATIONS_ENABLED=true

# Web Push (VAPID)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:support@trakrlog.com

# Notification Settings
NOTIFICATION_MAX_RETRY=3
NOTIFICATION_RETRY_DELAY=5s
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_TTL=86400  # Time-to-live in seconds (24 hours)
```

## Frontend Integration

### 1. Service Worker Setup

**Location**: `frontend/public/sw.js`

```javascript
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: '/badge.png',
    data: data.data,
    tag: data.tag,
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
```

### 2. Subscription Manager Component

**Location**: `frontend/src/components/app/Settings/NotificationSettings.tsx`

Features:
- Request notification permission
- Subscribe/unsubscribe to push notifications
- View active subscriptions
- Test notifications
- Enable/disable notifications per subscription

### 3. API Client Methods

```typescript
// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Subscribe to push notifications
async function subscribeToPush(vapidPublicKey: string): Promise<void> {
  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');
  
  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }
  
  // Subscribe to push manager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey
  });
  
  // Send subscription to backend
  const response = await fetch('/api/notifications/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: arrayBufferToBase64(subscription.getKey('auth')),
      userAgent: navigator.userAgent
    })
  });
  
  if (!response.ok) throw new Error('Failed to subscribe');
}

// Unsubscribe from push notifications
async function unsubscribeFromPush(subscriptionId: string): Promise<void> {
  const response = await fetch(`/api/notifications/subscriptions/${subscriptionId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) throw new Error('Failed to unsubscribe');
}
```

## Security Considerations

1. **Permission Validation**: Always verify user owns the project/channel before sending notifications
2. **Rate Limiting**: Implement rate limits on notification endpoints to prevent abuse
3. **Token Security**: Store push tokens securely, never expose in logs
4. **VAPID Keys**: Keep private VAPID key secret, rotate periodically
5. **Subscription Cleanup**: Remove expired/invalid subscriptions regularly (410 Gone responses)
6. **User Consent**: Always require explicit user permission before subscribing

## Performance Considerations

1. **Async Processing**: Process notifications asynchronously to avoid blocking event creation
2. **Batch Processing**: Send notifications in batches when a user has multiple subscriptions
3. **Queue System**: Consider using a message queue (Redis, RabbitMQ) for high-volume scenarios
4. **Caching**: Cache active subscriptions to reduce database queries
5. **Retry Logic**: Implement exponential backoff for failed deliveries

## Implementation Phases

### Phase 1: Foundation (MVP)

#### Step 1: Backend Data Models & Database
- [ ] Create `NotificationSubscription` model in `internal/model/notification.go`
- [ ] Create `NotificationLog` model in `internal/model/notification.go`
- [ ] Add MongoDB indexes for subscriptions (userID, enabled)
- [ ] Test database models

#### Step 2: Repository Layer
- [ ] Create `NotificationSubscriptionRepository` interface in `internal/repository/notification.go`
- [ ] Implement subscription repository methods (Create, FindByID, FindByUserID, Update, Delete, FindActiveByUserID)
- [ ] Create `NotificationLogRepository` interface (optional for MVP)
- [ ] Write repository unit tests

#### Step 3: VAPID Setup & Configuration
- [ ] Install `github.com/SherClockHolmes/webpush-go` library
- [ ] Generate VAPID key pair (run once, store in `.env`)
- [ ] Add VAPID configuration to environment variables
- [ ] Create configuration loader for push settings

#### Step 4: Push Service
- [ ] Create `PushService` in `internal/service/push.go`
- [ ] Implement `SendNotification` method with VAPID signing
- [ ] Implement `ValidateSubscription` method
- [ ] Add retry logic for failed sends
- [ ] Handle 410 Gone responses (invalid subscriptions)
- [ ] Test with mock subscriptions

#### Step 5: Notification Service
- [ ] Create `NotificationService` in `internal/service/notification.go`
- [ ] Implement `ProcessEventNotification` method
- [ ] Build notification payload from event data
- [ ] Fetch active subscriptions for user
- [ ] Call PushService for each subscription
- [ ] Log delivery attempts (if logging enabled)
- [ ] Test notification flow

#### Step 6: API Endpoints - Subscription Management
- [ ] Create `NotificationHandler` in `internal/handler/notification.go`
- [ ] Implement `POST /api/notifications/subscriptions` (create subscription)
- [ ] Implement `GET /api/notifications/subscriptions` (list user's subscriptions)
- [ ] Implement `DELETE /api/notifications/subscriptions/:id` (remove subscription)
- [ ] Implement `PATCH /api/notifications/subscriptions/:id` (enable/disable)
- [ ] Add routes to server
- [ ] Test endpoints with Postman/curl

#### Step 7: API Endpoints - Testing
- [ ] Implement `POST /api/notifications/test` (send test notification)
- [ ] Implement `GET /api/notifications/logs` (optional, for debugging)
- [ ] Test test endpoint

#### Step 8: Integration with Event Creation
- [ ] Inject NotificationService into EventService/EventHandler
- [ ] Call `ProcessEventNotification` after event is created
- [ ] Handle errors gracefully (don't fail event creation if notification fails)
- [ ] Test end-to-end: create event → notification sent

#### Step 9: Frontend - Service Worker
- [ ] Create `frontend/public/sw.js` service worker file
- [ ] Implement `push` event listener
- [ ] Implement `notificationclick` event listener
- [ ] Register service worker in main app
- [ ] Test service worker registration

#### Step 10: Frontend - Subscription UI
- [ ] Create notification settings component
- [ ] Add "Enable Notifications" button
- [ ] Request browser permission
- [ ] Subscribe to push manager with VAPID public key
- [ ] Send subscription to backend API
- [ ] Display active subscriptions
- [ ] Add unsubscribe functionality
- [ ] Test subscription flow in browser

#### Step 11: Frontend - Display & Styling
- [ ] Style notification permission prompt
- [ ] Style subscription management UI
- [ ] Add loading states
- [ ] Add error handling and user feedback
- [ ] Test on different browsers (Chrome, Firefox, Edge, Safari)

#### Step 12: Testing & Polish
- [ ] End-to-end testing (event → notification → click)
- [ ] Test on multiple devices/browsers
- [ ] Test subscription persistence
- [ ] Test invalid subscription cleanup
- [ ] Add logging for debugging
- [ ] Update documentation
- [ ] Deploy to staging environment

### Phase 2: Notification Rules (Enhancement)
- [ ] NotificationRule data model
- [ ] NotificationRuleRepository implementation
- [ ] Rule evaluation logic in NotificationService
- [ ] Project-level rules (enable/disable per project)
- [ ] Channel-level rules (enable/disable per channel)
- [ ] Tag-based filtering
- [ ] Keyword matching in title/description
- [ ] Throttling logic (prevent spam)
- [ ] Rule management API endpoints
- [ ] Rule management UI
- [ ] Rule priority system
- [ ] Notification preview/testing

### Phase 3: Advanced Features
- [ ] Notification templates
- [ ] Quiet hours/Do Not Disturb
- [ ] Notification digest (summarize multiple events)
- [ ] Delivery analytics and insights
- [ ] Webhook alternative (for integrations)

## Testing Strategy

### Unit Tests
- Test notification payload formatting
- Test subscription validation
- Test VAPID signature generation

### Integration Tests
- Test end-to-end flow from event creation to notification delivery
- Test with mock push providers
- Test subscription lifecycle

### Manual Testing
- Test on different browsers (Chrome, Firefox, Safari, Edge)
- Test on different operating systems (Windows, macOS, Linux)
- Test notification appearance and click actions
- Test permission flows and denial handling
- Test subscription persistence across browser restarts

## Monitoring and Debugging

### Metrics to Track
- Notification delivery success rate
- Average delivery time
- Failed deliveries
- Active subscriptions count
- Most triggered rules

### Logging
- Log all notification attempts with event ID and user ID
- Log push service errors
- Log throttling decisions
- Log subscription changes

### Debugging Tools
- Test notification endpoint for manual testing
- Notification logs UI for users to see delivery history
- Admin dashboard for system-wide notification metrics

## Alternative Approaches

### Server-Sent Events (SSE)
- Simpler implementation, no VAPID/service workers
- Real-time when dashboard is open
- Only works when browser tab is active
- Good for in-app notifications

### Webhook-Based Notifications
- More flexible for integrations (Slack, Discord, PagerDuty)
- Easier to implement
- No client-side dependencies
- Consider as complementary feature

### Email Notifications
- Simpler alternative requiring no client setup
- Use existing email infrastructure
- Higher latency but universal compatibility
- Good fallback when push fails
- Consider as complementary feature

## References

- [Web Push Protocol (RFC 8030)](https://tools.ietf.org/html/rfc8030)
- [webpush-go Library](https://github.com/SherClockHolmes/webpush-go)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## Questions to Answer

Before implementation, consider:

1. **Should notifications be opt-in or opt-out?** (Recommend: Opt-in via subscription)
2. **Should we support notification sounds?** (Yes, use browser defaults)
3. **How long should we retain notification logs?** (Recommend: 7 days for MVP, make optional)
4. **Do we need admin controls to disable notifications globally?** (Yes, good for maintenance)
5. **What happens when a subscription becomes invalid?** (Auto-cleanup on 410 Gone responses)
6. **Maximum subscriptions per user?** (Recommend: 5 devices/browsers for MVP)
7. **Should all events notify in MVP?** (Yes, add filtering in Phase 2)
8. **How to handle notification overload?** (Phase 2: implement rules and throttling)

---

**Last Updated**: December 5, 2025
