# Testing Push Notifications API

This guide shows how to test the notification endpoints using curl and your browser.

## Prerequisites

1. **Server Running**: Start the server with `make run` or `go run cmd/api/main.go`
2. **Authentication**: You need to be logged in via OAuth (Google/GitHub)
3. **VAPID Keys**: Already configured in `.env.local`

## Getting Your Session Cookie

The API requires authentication. First, log in via the web interface:

1. Start the server: `make run`
2. Open browser: http://localhost:4000
3. Log in via Google or GitHub
4. Open browser DevTools (F12) → Application/Storage → Cookies
5. Copy the `session` cookie value

For curl testing, you can extract the cookie like this:

```bash
# After logging in via browser, check your cookies
# The session cookie will look like: MTczMzQ0NDE3NXx...
```

## Test Endpoints

### 1. Create a Subscription

This simulates a browser subscribing to push notifications.

```bash
# Replace YOUR_SESSION_COOKIE with your actual session cookie
curl -X POST http://localhost:4000/api/notifications/subscriptions \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
    "p256dh": "BMK8XQKFBZ1CXxkYZ9xZJYL1234567890abcdefghijklmnopqrstuvwxyz",
    "auth": "abc123def456",
    "userAgent": "Mozilla/5.0 (Test)"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "id": "674f8a1b2c9d3e4f5a6b7c8d",
    "userId": "674e5f6g7h8i9j0k1l2m3n4o",
    "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
    "enabled": true,
    "createdAt": "2025-12-05T10:30:00Z",
    "updatedAt": "2025-12-05T10:30:00Z"
  }
}
```

### 2. List Your Subscriptions

```bash
curl http://localhost:4000/api/notifications/subscriptions \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "674f8a1b2c9d3e4f5a6b7c8d",
      "userId": "674e5f6g7h8i9j0k1l2m3n4o",
      "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
      "enabled": true,
      "createdAt": "2025-12-05T10:30:00Z",
      "updatedAt": "2025-12-05T10:30:00Z"
    }
  ]
}
```

### 3. Update a Subscription (Enable/Disable)

```bash
# Disable notifications
curl -X PATCH http://localhost:4000/api/notifications/subscriptions/674f8a1b2c9d3e4f5a6b7c8d \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "enabled": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "subscription": {
    "id": "674f8a1b2c9d3e4f5a6b7c8d",
    "enabled": false,
    "updatedAt": "2025-12-05T10:35:00Z"
  }
}
```

### 4. Send Test Notification

```bash
curl -X POST http://localhost:4000/api/notifications/test \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully"
}
```

**Note**: This will only work if you have a real browser subscription. For testing without a browser, the endpoint will attempt to send but may fail since test subscriptions aren't valid.

### 5. Delete a Subscription

```bash
curl -X DELETE http://localhost:4000/api/notifications/subscriptions/674f8a1b2c9d3e4f5a6b7c8d \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

## Testing with Real Browser Subscriptions

For complete end-to-end testing, you need a real browser subscription:

### Step 1: Create a Test HTML Page

Create `test-notifications.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Push Notifications</title>
</head>
<body>
  <h1>TrakrLog Push Notification Test</h1>
  <button id="subscribe">Subscribe to Notifications</button>
  <button id="unsubscribe">Unsubscribe</button>
  <button id="test">Send Test</button>
  <pre id="output"></pre>

  <script>
    const VAPID_PUBLIC_KEY = 'BO2WN684M2ESAhj61Cs0egF2Bxv9R74EnHQsSzinUgf2hCulzzoIts-ckfF9yudzKbOHyuQTs_HmkvUBDKEs5m8';
    const API_BASE = 'http://localhost:4000/api';
    let subscriptionId = null;

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    function arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }

    async function subscribe() {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Send to backend
        const response = await fetch(`${API_BASE}/notifications/subscriptions`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth')),
            userAgent: navigator.userAgent
          })
        });

        const data = await response.json();
        subscriptionId = data.subscription.id;
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        document.getElementById('output').textContent = 'Error: ' + error.message;
      }
    }

    async function unsubscribe() {
      if (!subscriptionId) {
        document.getElementById('output').textContent = 'No active subscription';
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/notifications/subscriptions/${subscriptionId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);
        subscriptionId = null;
      } catch (error) {
        document.getElementById('output').textContent = 'Error: ' + error.message;
      }
    }

    async function sendTest() {
      try {
        const response = await fetch(`${API_BASE}/notifications/test`, {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json();
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        document.getElementById('output').textContent = 'Error: ' + error.message;
      }
    }

    document.getElementById('subscribe').addEventListener('click', subscribe);
    document.getElementById('unsubscribe').addEventListener('click', unsubscribe);
    document.getElementById('test').addEventListener('click', sendTest);
  </script>
</body>
</html>
```

### Step 2: Create Service Worker

Create `frontend/public/sw.js`:

```javascript
self.addEventListener('push', event => {
  console.log('Push received:', event);
  
  const data = event.data ? event.data.json() : {
    title: 'Test Notification',
    body: 'This is a test notification'
  };
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: '/badge.png',
    data: data.data,
    tag: data.tag || 'trakrlog',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
```

### Step 3: Test in Browser

1. Start your server: `make run`
2. Log in at http://localhost:4000
3. Open the test page
4. Click "Subscribe to Notifications"
5. Grant permission when prompted
6. Click "Send Test" to receive a notification

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution**: Make sure you're logged in and passing the session cookie correctly.

### Issue: "Subscription not found"
**Solution**: Create a subscription first using the POST endpoint or browser test page.

### Issue: "Invalid user ID"
**Solution**: Your session might be expired. Log in again.

### Issue: No notification received
**Possible causes**:
1. Service worker not registered
2. Subscription endpoint is fake/test data (use real browser subscription)
3. Browser doesn't support push notifications
4. Notification permission not granted

### Issue: CORS errors in browser
**Solution**: The server is already configured for localhost:4000. Make sure you're accessing from that origin.

## Automated Testing Script

Create `test-notifications.sh`:

```bash
#!/bin/bash

# Set your session cookie here
SESSION_COOKIE="YOUR_SESSION_COOKIE"
BASE_URL="http://localhost:4000/api"

echo "=== Testing Notification Endpoints ==="
echo ""

# Test 1: Create subscription
echo "1. Creating subscription..."
SUB_ID=$(curl -s -X POST "$BASE_URL/notifications/subscriptions" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=$SESSION_COOKIE" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/test-'$(date +%s)'",
    "p256dh": "BMK8XQKFBZ1CXxkYZ9xZJYL1234567890abcdefghijklmnopqrstuvwxyz",
    "auth": "abc123def456",
    "userAgent": "curl-test"
  }' | jq -r '.subscription.id')
echo "Created subscription: $SUB_ID"
echo ""

# Test 2: List subscriptions
echo "2. Listing subscriptions..."
curl -s "$BASE_URL/notifications/subscriptions" \
  -H "Cookie: session=$SESSION_COOKIE" | jq
echo ""

# Test 3: Update subscription
echo "3. Disabling subscription..."
curl -s -X PATCH "$BASE_URL/notifications/subscriptions/$SUB_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=$SESSION_COOKIE" \
  -d '{"enabled": false}' | jq
echo ""

# Test 4: Delete subscription
echo "4. Deleting subscription..."
curl -s -X DELETE "$BASE_URL/notifications/subscriptions/$SUB_ID" \
  -H "Cookie: session=$SESSION_COOKIE" | jq
echo ""

echo "=== Testing Complete ==="
```

Make it executable:
```bash
chmod +x test-notifications.sh
```

Run it:
```bash
./test-notifications.sh
```

## Next Steps

After verifying the endpoints work:
1. ✅ Step 6 complete
2. Move to Step 7: Implement test notification endpoint (already done!)
3. Move to Step 8: Integration with event creation
4. Move to Step 9-11: Frontend implementation
