# Mobile App Integration Guide - RentYatra Frontend

## Overview

This guide explains how the RentYatra web frontend integrates with the Flutter mobile app (webview_master_app) to enable push notifications and seamless user experience.

## Architecture

### Communication Flow

```
┌─────────────────────────┐
│  RentYatra Web App      │
│  (React Frontend)       │
└──────────┬──────────────┘
           │
           │ JavaScript Bridge
           │ (window.flutter_inappwebview)
           ▼
┌─────────────────────────┐
│  Flutter WebView App    │
│  (webview_master_app)   │
└─────────────────────────┘
```

## Key Components

### 1. Mobile App Bridge (`src/utils/mobileAppBridge.js`)

Utility module that:
- Detects if running in Flutter WebView
- Sends login events to mobile app
- Handles communication with Flutter app

**Key Functions:**
- `isRunningInFlutterWebView()` - Detects WebView environment
- `sendLoginEventToMobileApp(phone, userData)` - Sends login event
- `initializeMobileAppBridge()` - Initializes bridge on app load

### 2. AuthContext Integration

The `AuthContext` component automatically:
- Detects mobile app environment
- Sends login events when user logs in
- Includes phone number in login events

## How It Works

### Step 1: User Logs In

When a user logs in via OTP:

1. **Login function** in `AuthContext` is called
2. **User data** is stored (includes phone number)
3. **Mobile bridge** detects if running in WebView
4. **Login event** is sent to Flutter app

### Step 2: Login Event Sent

```javascript
sendLoginEventToMobileApp(phone, userData);
```

This function:
- Validates phone number (10 digits)
- Cleans phone number (removes +91, spaces, etc.)
- Sends event via JavaScript bridge:
  ```javascript
  window.flutter_inappwebview.callHandler('onLogin', {
    phone: '9876543210',
    timestamp: '2024-01-01T00:00:00.000Z',
    user: {...}
  });
  ```

### Step 3: Flutter App Receives Event

The Flutter app:
1. Receives login event with phone number
2. Saves phone number to local storage
3. Retrieves FCM token
4. Saves FCM token to RentYatra backend

## Integration Points

### Login Flow

Login events are sent in these scenarios:

1. **After OTP Verification** (`verifyOTP`)
   - User verifies OTP during signup/login
   - Phone number is sent to mobile app

2. **After Login with OTP** (`loginWithOTP`)
   - User logs in with existing account
   - Phone number is sent to mobile app

3. **After Regular Login** (`login`)
   - User data includes phone number
   - Phone number is extracted and sent

## Code Examples

### Sending Login Event

```javascript
import { sendLoginEventToMobileApp } from '../utils/mobileAppBridge';

// After successful login
const phone = userData.phone || userData.formattedPhone;
if (phone) {
  sendLoginEventToMobileApp(phone, userData);
}
```

### Checking if Running in Mobile App

```javascript
import { isRunningInFlutterWebView } from '../utils/mobileAppBridge';

if (isRunningInFlutterWebView()) {
  // Running in mobile app
  // Send mobile-specific events
} else {
  // Running in regular browser
}
```

## Phone Number Format

The mobile app expects:
- **10-digit Indian phone number**
- **Without +91 prefix**
- **No spaces or dashes**

Examples:
- ✅ `9876543210` (correct)
- ❌ `+919876543210` (wrong - has +91)
- ❌ `+91 98765 43210` (wrong - has spaces)
- ❌ `919876543210` (wrong - has 91 prefix)

The `mobileAppBridge.js` automatically cleans the phone number before sending.

## Error Handling

### Bridge Not Available

If Flutter WebView bridge is not available:
- Function returns `false`
- Logs warning message
- Retries after 2 seconds
- Does not block login flow

### Invalid Phone Number

If phone number is invalid:
- Function returns `false`
- Logs error message
- Does not block login flow

## Testing

### Test in Browser

1. Open web app in regular browser
2. Login should work normally
3. No mobile app events sent (expected)

### Test in Mobile App

1. Open web app in Flutter WebView app
2. Login with OTP
3. Check Flutter app logs for:
   - `🔐 Login event received`
   - `📱 Phone number found`
   - `✅ FCM token saved successfully`

### Debug Logs

Enable console logs to see:
- `📱` - Mobile app related
- `✅` - Success
- `❌` - Errors
- `⚠️` - Warnings

## Configuration

No configuration needed! The bridge automatically:
- Detects mobile app environment
- Sends events when needed
- Handles errors gracefully

## Troubleshooting

### Issue: Login events not sent

**Check:**
1. Is app running in Flutter WebView? (Check `isRunningInFlutterWebView()`)
2. Is phone number available in user data?
3. Check browser console for errors

### Issue: Phone number format wrong

**Check:**
1. Phone number cleaning logic in `mobileAppBridge.js`
2. Phone number format from backend
3. Check console logs for phone number format

### Issue: Bridge not working

**Check:**
1. Is `window.flutter_inappwebview` available?
2. Check Flutter app logs for bridge setup
3. Verify JavaScript is enabled in WebView

## Integration Checklist

- [x] Mobile app bridge utility created
- [x] AuthContext sends login events
- [x] Phone number format validation
- [x] Error handling implemented
- [x] Retry logic for bridge availability
- [ ] Tested in Flutter WebView app
- [ ] Verified FCM token saved after login
- [ ] Push notifications working

## Related Files

- `src/utils/mobileAppBridge.js` - Bridge utility
- `src/contexts/AuthContext.jsx` - Login event integration
- `src/user/pages/Login.jsx` - Login page

## Backend Integration

The mobile app sends FCM token to:
```
POST /api/users/save-fcm-token-mobile
```

With payload:
```json
{
  "token": "fcm_token_string",
  "phone": "9876543210",
  "platform": "android"
}
```

See `Backend/FCM_TOKEN_API_DOCUMENTATION.md` for details.

## Support

For issues:
1. Check browser console logs
2. Check Flutter app logs
3. Verify backend API is accessible
4. Test with Postman/curl

