# FCM Token API Documentation for APK/Mobile Team

## Overview
This document describes the API endpoints for managing FCM (Firebase Cloud Messaging) tokens for push notifications in the RentYatra application. These endpoints allow the APK/mobile app to register, update, and remove FCM tokens.

## ⚡ Quick Start - APK Team
**Minimum Required: Just 1 Endpoint!**

For APK team, you only need **ONE endpoint** to save FCM tokens:
- **`POST /api/users/save-fcm-token-mobile`** - Works without login (uses phone number)

This single endpoint will handle:
- ✅ App launch (before login)
- ✅ After login
- ✅ Token refresh
- ✅ Multiple devices

**Optional Endpoints** (if you want more control):
- `POST /api/users/save-fcm-token` - After login (with JWT token)
- `DELETE /api/users/remove-fcm-token` - On logout/uninstall

---

## Base URL
```
Production: https://api.rentyatra.com/api
Development: http://localhost:5000/api
```

---

## Endpoints

### 1. Save FCM Token (Authenticated - After Login)
**Use this endpoint when the user is logged in.**

#### Endpoint
```
POST /api/users/save-fcm-token
```

#### Authentication
**Required**: Bearer token in Authorization header
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "token": "your_fcm_token_string",
  "platform": "mobile"  // Optional: "web" | "mobile" | "android" | "ios"
}
```

#### Request Example (cURL)
```bash
curl -X POST https://api.rentyatra.com/api/users/save-fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "dAbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "platform": "mobile"
  }'
```

#### Request Example (JavaScript/Fetch)
```javascript
const saveFCMToken = async (token, platform = 'mobile') => {
  const response = await fetch('https://api.rentyatra.com/api/users/save-fcm-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}` // JWT token from login
    },
    body: JSON.stringify({
      token: token,
      platform: platform
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "FCM token saved successfully for this device",
  "updated": true,
  "tokenCount": 3,
  "previousTokenCount": 2,
  "maxTokens": 10,
  "devicesRegistered": 3,
  "platform": "mobile"
}
```

#### Error Responses

**400 Bad Request** - Invalid token
```json
{
  "success": false,
  "message": "Token missing or invalid"
}
```

**401 Unauthorized** - Missing or invalid JWT token
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

**404 Not Found** - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 2. Save FCM Token (Mobile - No Login Required) ⭐ **RECOMMENDED FOR APK - USE THIS ONE!**
**This is the MAIN endpoint for APK team. Use this for all scenarios - before login, after login, token refresh, everything!**

#### Endpoint
```
POST /api/users/save-fcm-token-mobile
```

#### Authentication
**Not Required** - This is a public endpoint, but requires phone number

#### Request Body
```json
{
  "token": "your_fcm_token_string",
  "phone": "9876543210",  // 10-digit Indian phone number (without +91)
  "platform": "mobile"     // Optional: "mobile" | "android" | "ios"
}
```

#### Request Example (cURL)
```bash
curl -X POST https://api.rentyatra.com/api/users/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "dAbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "phone": "9876543210",
    "platform": "mobile"
  }'
```

#### Request Example (JavaScript/Fetch)
```javascript
const saveFCMTokenMobile = async (token, phone, platform = 'mobile') => {
  const response = await fetch('https://api.rentyatra.com/api/users/save-fcm-token-mobile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
      phone: phone, // 10-digit phone number (without +91)
      platform: platform
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "FCM token saved successfully for mobile device",
  "updated": true,
  "tokenCount": 2,
  "previousTokenCount": 1,
  "maxTokens": 10,
  "devicesRegistered": 2,
  "platform": "mobile"
}
```

#### Error Responses

**400 Bad Request** - Missing or invalid data
```json
{
  "success": false,
  "message": "FCM token is required"
}
```
or
```json
{
  "success": false,
  "message": "Please provide a valid 10-digit Indian phone number"
}
```

**404 Not Found** - User not found with phone number
```json
{
  "success": false,
  "message": "User not found with this phone number. Please register first."
}
```

---

### 3. Remove FCM Token (On Logout/App Uninstall)

#### Endpoint
```
DELETE /api/users/remove-fcm-token
```

#### Authentication
**Required**: Bearer token in Authorization header

#### Request Body
```json
{
  "token": "your_fcm_token_string"
}
```

#### Request Example
```javascript
const removeFCMToken = async (token) => {
  const response = await fetch('https://api.rentyatra.com/api/users/remove-fcm-token', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      token: token
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "FCM token removed successfully",
  "tokenRemoved": true,
  "tokenCount": 2,
  "previousTokenCount": 3
}
```

---

## Implementation Guide for APK Team

### 🎯 Recommended Approach: Use Only One Endpoint

**For APK team, we recommend using ONLY `/save-fcm-token-mobile` endpoint for all scenarios:**

1. ✅ App launch (before login) - Use phone number from user
2. ✅ After login - Use same endpoint with phone number
3. ✅ Token refresh - Use same endpoint

**Why?** 
- Simpler implementation
- Works in all scenarios
- No need to switch between endpoints
- Phone number is always available after login

---

### Step 1: Get FCM Token in Android App

```kotlin
// In your Android app
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (!task.isSuccessful) {
        Log.w(TAG, "Fetching FCM registration token failed", task.exception)
        return@addOnCompleteListener
    }

    // Get new FCM registration token
    val token = task.result
    Log.d(TAG, "FCM Registration Token: $token")
    
    // Send token to backend
    sendTokenToBackend(token)
}
```

### Step 2: Send Token to Backend (USE THIS - Recommended for APK)

**Use `/save-fcm-token-mobile` endpoint for ALL scenarios:**

#### When to Call:
- App launch (if user has phone number saved)
- After successful login
- When FCM token refreshes
- On app restart

```kotlin
fun sendTokenToBackend(token: String, phoneNumber: String) {
    val apiService = RetrofitClient.getApiService()
    val request = FCMTokenRequest(
        token = token,
        phone = phoneNumber, // Remove +91 prefix if present
        platform = "android"
    )
    
    apiService.saveFCMTokenMobile(request).enqueue(object : Callback<FCMTokenResponse> {
        override fun onResponse(call: Call<FCMTokenResponse>, response: Response<FCMTokenResponse>) {
            if (response.isSuccessful) {
                Log.d(TAG, "FCM token saved: ${response.body()?.message}")
            } else {
                Log.e(TAG, "Failed to save FCM token: ${response.message()}")
            }
        }
        
        override fun onFailure(call: Call<FCMTokenResponse>, t: Throwable) {
            Log.e(TAG, "Error saving FCM token", t)
        }
    })
}
```

#### Alternative: After Login (Optional - Only if you want to use JWT token)

**You can also use `/save-fcm-token` endpoint after login if you prefer JWT authentication:**

```kotlin
fun sendTokenToBackendAfterLogin(token: String, jwtToken: String) {
    val apiService = RetrofitClient.getApiService()
    val request = FCMTokenRequest(
        token = token,
        platform = "android"
    )
    
    apiService.saveFCMToken("Bearer $jwtToken", request).enqueue(object : Callback<FCMTokenResponse> {
        override fun onResponse(call: Call<FCMTokenResponse>, response: Response<FCMTokenResponse>) {
            if (response.isSuccessful) {
                Log.d(TAG, "FCM token saved: ${response.body()?.message}")
            }
        }
        
        override fun onFailure(call: Call<FCMTokenResponse>, t: Throwable) {
            Log.e(TAG, "Error saving FCM token", t)
        }
    })
}
```

### Step 3: Handle Token Refresh

FCM tokens can be refreshed. Listen for token refresh events:

```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (!task.isSuccessful) {
        return@addOnCompleteListener
    }
    
    val newToken = task.result
    // Send new token to backend
    sendTokenToBackend(newToken, phoneNumber)
}
```

### Step 4: Remove Token on Logout

```kotlin
fun removeTokenOnLogout(token: String, jwtToken: String) {
    val apiService = RetrofitClient.getApiService()
    val request = FCMTokenRequest(token = token)
    
    apiService.removeFCMToken("Bearer $jwtToken", request).enqueue(object : Callback<FCMTokenResponse> {
        override fun onResponse(call: Call<FCMTokenResponse>, response: Response<FCMTokenResponse>) {
            if (response.isSuccessful) {
                Log.d(TAG, "FCM token removed: ${response.body()?.message}")
            }
        }
        
        override fun onFailure(call: Call<FCMTokenResponse>, t: Throwable) {
            Log.e(TAG, "Error removing FCM token", t)
        }
    })
}
```

---

## Important Notes

1. **Token Format**: FCM tokens are long strings. Make sure to send the complete token without truncation.

2. **Phone Number Format**: 
   - Send 10-digit phone number (without +91 prefix) for `/save-fcm-token-mobile` endpoint
   - Example: `"9876543210"` (not `"+919876543210"` or `"919876543210"`)

3. **Platform Parameter**: 
   - Optional but recommended
   - Use `"mobile"`, `"android"`, or `"ios"` to identify the platform

4. **Token Limit**: 
   - Maximum 10 tokens per user
   - Oldest tokens are automatically removed when limit is reached

5. **Token Refresh**: 
   - FCM tokens can change
   - Always send updated tokens to backend
   - Listen for token refresh events in your app

6. **Error Handling**: 
   - Always check `success` field in response
   - Handle 404 errors (user not found) appropriately
   - Retry failed requests with exponential backoff

7. **Which Endpoint to Use**:
   - **For APK Team (Recommended)**: Use `/save-fcm-token-mobile` for ALL scenarios (before login, after login, token refresh)
   - **Alternative**: Use `/save-fcm-token` after login if you prefer JWT authentication
   - **On Logout (Optional)**: Use `/remove-fcm-token` to remove token (not mandatory, tokens are automatically cleaned)

---

## Testing

### Test with cURL

```bash
# Test mobile endpoint (before login)
curl -X POST http://localhost:5000/api/users/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_token_123456789",
    "phone": "9876543210",
    "platform": "android"
  }'

# Test authenticated endpoint (after login)
curl -X POST http://localhost:5000/api/users/save-fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "test_token_123456789",
    "platform": "android"
  }'
```

---

## Support

For questions or issues, contact the backend team or refer to:
- Backend repository: `/Backend`
- Server logs: `/Backend/logs/app.log`

---

## Changelog

- **v1.0** (2024): Initial FCM token API endpoints
  - Added `/save-fcm-token` (authenticated)
  - Added `/save-fcm-token-mobile` (public, with phone)
  - Added `/remove-fcm-token` (authenticated)
  - Support for platform identification
  - Maximum 10 tokens per user

