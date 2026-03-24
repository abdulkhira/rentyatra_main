# Push Notification API Documentation

## Base URL
```
https://api.rentyatra.com
```

---

## 📱 1. Chat Message Notification

### When Triggered
जब दो users के बीच chat message भेजा जाता है।

### Endpoints

#### 1.1 REST API Endpoint
```
POST /api/chat/send
```

**Full URL:**
```
https://api.rentyatra.com/api/chat/send
```

**Method:** `POST`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "receiverId": "690b037f32ed6bc4bcf364a1",
  "content": "Hello! Kya haal hai?",
  "productId": null
}
```

**Required Fields:**
- `receiverId` - जिस user को message भेजना है उसका ID
- `content` - message का text

**Optional Fields:**
- `productId` - अगर product से related chat है तो product ID

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "message_id",
    "sender": {
      "_id": "sender_id",
      "name": "Sender Name",
      "email": "sender@email.com"
    },
    "receiver": {
      "_id": "receiver_id",
      "name": "Receiver Name",
      "email": "receiver@email.com"
    },
    "content": "Hello! Kya haal hai?",
    "conversationId": "conversation_id",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Notification Details:**
- **Title:** `"[Sender Name] sent a message"`
- **Body:** Message content (truncated to 100 chars if longer)
- **Link:** `/chat/[senderId]`
- **Type:** `message`
- **Handler:** `message`

**Code Location:**
- Controller: `controllers/chatController.js` - `sendMessage()` function
- Notification Handler: `controllers/messageController.js` - `handleNewMessage()` function
- Service: `services/firebaseAdmin.js` - `sendPushNotification()` function

---

#### 1.2 Socket.io Event
```
Event: send_message
```

**Event Data:**
```json
{
  "senderId": "690b037f32ed6bc4bcf364a1",
  "receiverId": "690b037f32ed6bc4bcf364a1",
  "content": "Hello! Message text",
  "productId": null
}
```

**Notification Trigger:**
- Same as REST API - automatically sends notification to receiver

**Code Location:**
- File: `server.js` - Socket.io `send_message` event handler (line ~257)
- Calls: `handleNewMessage(message)` function

---

## 🎉 2. Rental Approval Notification

### When Triggered
जब admin किसी rental request को approve करता है।

### Endpoint
```
PUT /api/admin/rental-requests/:id/status
```

**Full URL:**
```
https://api.rentyatra.com/api/admin/rental-requests/[RENTAL_ID]/status
```

**Method:** `PUT`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "approved",
  "notificationMessage": "Aapka rental listing approve ho gaya hai! Ab aapka listing live hai."
}
```

**Required Fields:**
- `status` - Must be `"approved"` for notification

**Optional Fields:**
- `notificationMessage` - Custom notification message (if not provided, default message is used)
- `rejectionReason` - Only for rejected status

**Response (200):**
```json
{
  "success": true,
  "message": "Rental request approved successfully",
  "data": {
    "request": {
      "_id": "rental_id",
      "title": "Rental Title",
      "status": "approved",
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
      }
    }
  }
}
```

**Notification Details:**
- **Title:** `"🎉 Rental Listing Approved!"`
- **Body:** Custom message (if provided) or default: `"Your rental '[Title]' has been approved and is now live!"`
- **Link:** `/rentals/[rentalId]`
- **Type:** `rental_approved`
- **Handler:** `rental`

**User Detection Methods:**
1. Populated user from request
2. Direct user ObjectId from request
3. Find user by email from `contactInfo.email`
4. Find user by phone from `contactInfo.phone`

**Code Location:**
- Controller: `controllers/rentalRequestController.js` - `updateRentalRequestStatus()` function
- Service: `services/firebaseAdmin.js` - `sendPushNotification()` function

---

## 🧪 3. Manual/Test Notification Endpoint

### Endpoint
```
POST /api/notifications/send-notification
```

**Full URL:**
```
https://api.rentyatra.com/api/notifications/send-notification
```

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "FCM_TOKEN_HERE",
  "title": "Test Notification",
  "body": "This is a test notification message"
}
```

**Required Fields:**
- `token` - FCM token of the device
- `title` - Notification title
- `body` - Notification body/message

**Response (200):**
```json
{
  "success": true,
  "message": "Notification sent successfully!",
  "response": "projects/rentyatra-1e42a/messages/0:1762338955353090%83f62fc283f62fc2"
}
```

**Code Location:**
- Controller: `controllers/notificationController.js` - `sendNotification()` function
- Service: `services/firebaseAdmin.js` - Direct Firebase Admin SDK usage

---

## 📋 Notification Service Details

### Core Service Function
**File:** `services/firebaseAdmin.js`

**Function:** `sendPushNotification(tokens, payload)`

**Parameters:**
- `tokens` - Array of FCM tokens (web + mobile combined, duplicates removed)
- `payload` - Notification payload object

**Payload Structure:**
```javascript
{
  title: "Notification Title",
  body: "Notification message body",
  data: {
    messageId: "message_id",
    type: "message" | "rental_approved",
    conversationId: "conversation_id",
    productId: "product_id",
    senderId: "sender_id",
    rentalId: "rental_id",
    handlerName: "message" | "rental",
    link: "/chat/userId" | "/rentals/rentalId"
  },
  handlerName: "message" | "rental",
  link: "/path/to/resource",
  icon: "/favicon.png" | "profile_picture_url"
}
```

**Features:**
- Duplicate token removal (web + mobile tokens combined)
- Duplicate notification prevention (10-second cache)
- FCM tag for notification replacement
- Web push configuration
- Mobile push configuration

---

## 🔧 Notification Helper Functions

### 1. handleNewMessage()
**File:** `controllers/messageController.js`

**Purpose:** Handles chat message notifications

**Features:**
- Duplicate prevention (10-second cache)
- Token deduplication
- Notification link generation
- Sender info extraction

**Called From:**
- `controllers/chatController.js` - `sendMessage()` function
- `server.js` - Socket.io `send_message` event

---

## 📊 Notification Flow Summary

### Chat Message Flow:
```
User sends message
  ↓
POST /api/chat/send OR Socket.io send_message
  ↓
Message saved to database
  ↓
handleNewMessage(message) called
  ↓
User FCM tokens fetched (web + mobile)
  ↓
Duplicate tokens removed
  ↓
sendPushNotification(tokens, payload) called
  ↓
Notification sent to receiver
```

### Rental Approval Flow:
```
Admin approves rental
  ↓
PUT /api/admin/rental-requests/:id/status
  ↓
Status updated to "approved"
  ↓
User found by multiple methods
  ↓
User FCM tokens fetched (web + mobile)
  ↓
Duplicate tokens removed
  ↓
sendPushNotification(tokens, payload) called
  ↓
Notification sent to rental owner
```

---

## 🔐 Authentication Requirements

| Endpoint | Authentication Required | Type |
|----------|------------------------|------|
| `/api/chat/send` | Yes | User JWT Token |
| Socket.io `send_message` | Yes | User JWT Token (via socket auth) |
| `/api/admin/rental-requests/:id/status` | Yes | Admin JWT Token |
| `/api/notifications/send-notification` | No | Public (for testing) |

---

## 📝 Important Notes

1. **Duplicate Prevention:**
   - Chat messages: 10-second cache prevents duplicate notifications
   - FCM tag: Same messageId replaces previous notification

2. **Token Management:**
   - Web tokens: `user.fcmTokens` array
   - Mobile tokens: `user.fcmTokenMobile` array
   - Duplicates automatically removed before sending

3. **Error Handling:**
   - Notification failures don't break main operations
   - Errors logged but don't throw exceptions

4. **User Detection:**
   - Rental approval tries multiple methods to find user
   - Falls back to email/phone from contactInfo if user field is null

---

## 🧪 Testing Endpoints

### Test Chat Notification:
```
POST https://api.rentyatra.com/api/chat/send
Headers:
  Authorization: Bearer USER_TOKEN
Body:
{
  "receiverId": "USER_ID",
  "content": "Test message"
}
```

### Test Rental Approval Notification:
```
PUT https://api.rentyatra.com/api/admin/rental-requests/RENTAL_ID/status
Headers:
  Authorization: Bearer ADMIN_TOKEN
Body:
{
  "status": "approved",
  "notificationMessage": "Test approval message"
}
```

### Test Manual Notification:
```
POST https://api.rentyatra.com/api/notifications/send-notification
Body:
{
  "token": "FCM_TOKEN",
  "title": "Test",
  "body": "Test message"
}
```

---

## 📁 File Structure

```
Backend/
├── services/
│   └── firebaseAdmin.js          # Core notification service
├── controllers/
│   ├── messageController.js      # Chat message notification handler
│   ├── chatController.js        # Chat REST API endpoint
│   ├── rentalRequestController.js # Rental approval notification
│   └── notificationController.js # Manual/test notification endpoint
└── server.js                     # Socket.io message handler
```

---

## ✅ Summary

**Total Notification Endpoints: 3**

1. ✅ Chat Message - `/api/chat/send` (REST) + Socket.io `send_message`
2. ✅ Rental Approval - `/api/admin/rental-requests/:id/status`
3. ✅ Manual/Test - `/api/notifications/send-notification`

**All notifications use:** `services/firebaseAdmin.js` - `sendPushNotification()` function

