# Push Notification Setup - Complete SOP (Standard Operating Procedure)
## RentYatra Project - Firebase Cloud Messaging (FCM) Implementation Guide

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## 📖 Overview

Yeh SOP document RentYatra project mein Push Notifications implement karne ke liye complete step-by-step guide hai. Isme Firebase se lekar app tak sab kuch detail mein cover kiya gaya hai.

**Technologies Used:**
- Firebase Cloud Messaging (FCM)
- Firebase Admin SDK (Backend)
- Firebase JavaScript SDK (Frontend)
- Service Workers (Web Push)

---

## 🔥 Firebase Console Setup

### Step 1: Firebase Project Create/Select Karna

1. **Firebase Console mein jao:**
   - Browser mein `https://console.firebase.google.com` open karo
   - Apna Google account se login karo

2. **Project Select ya Create karo:**
   - Agar project already hai (rentyatra-1e42a), to use select karo
   - Agar nahi hai, to "Add Project" click karo aur project create karo

3. **Project Details:**
   - Project Name: `rentyatra-1e42a` (ya apna project name)
   - Project ID note karo (yeh backend aur frontend dono mein use hoga)

### Step 2: Web App Register Karna

1. **Project Overview page par:**
   - Left sidebar mein "Project Settings" (gear icon) click karo
   - Ya directly "Add App" button click karo

2. **Web App Add karo:**
   - Web icon (</>) click karo
   - App nickname: `RentYatra Web App` (ya kuch bhi)
   - Firebase Hosting enable karne ki zarurat nahi hai (optional)
   - "Register app" button click karo

3. **Firebase Config Copy karo:**
   - Jo config milta hai, use copy karo:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyCTybWX-zsRixTgZ9q6rabPJZr9srY9S9g",
     authDomain: "rentyatra-1e42a.firebaseapp.com",
     projectId: "rentyatra-1e42a",
     storageBucket: "rentyatra-1e42a.firebasestorage.app",
     messagingSenderId: "901085016313",
     appId: "1:901085016313:web:3cfbd9d8c46c732494f228",
     measurementId: "G-00QWLKBH8W"
   };
   ```
   - **Note:** Yeh config frontend mein use hoga

### Step 3: Cloud Messaging (FCM) Enable Karna

1. **Project Settings mein:**
   - "Cloud Messaging" tab click karo
   - Agar enable nahi hai, to enable karo

2. **Web Push Certificates Generate karna:**
   - "Web Push certificates" section mein jao
   - "Generate key pair" button click karo
   - **VAPID Key** generate hoga - yeh IMPORTANT hai!
   - VAPID Key copy karo aur safe jagah save karo
   - Example: `BAXnzclIUpol3ExXQV8JokW7plpWqSJhLIFrXlnNHueIylJFuC3TQ17wWRIspB4IOmi-NffJuWq2mz9C6sC1YlQ`
   - **Note:** Yeh VAPID key frontend mein use hogi

### Step 4: Service Account Key Generate Karna (Backend ke liye)

1. **Project Settings mein:**
   - "Service accounts" tab click karo
   - "Generate new private key" button click karo
   - Warning dialog mein "Generate key" click karo
   - JSON file download hogi

2. **Service Account JSON File:**
   - File ka naam kuch aisa hoga: `rentyatra-1e42a-firebase-adminsdk-xxxxx-xxxxx.json`
   - Is file ko backend project mein save karo:
     - Path: `rentyatra/Backend/config/rentyatra-1e42a-firebase-adminsdk-xxxxx-xxxxx.json`
   - **IMPORTANT:** Is file ko `.gitignore` mein add karo (security ke liye)
   - File ko backend server par deploy karo (production mein)

3. **Environment Variable Setup:**
   - Backend `.env` file mein add karo:
   ```env
   # Option 1: Service Account File Path
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/rentyatra-1e42a-firebase-adminsdk-xxxxx-xxxxx.json
   
   # Option 2: Ya full JSON as environment variable (production ke liye better)
   # FIREBASE_CONFIG={"type":"service_account","project_id":"rentyatra-1e42a",...}
   ```

### Step 5: Firebase Console mein Permissions Check karna

1. **Cloud Messaging API Enable:**
   - Google Cloud Console mein jao: `https://console.cloud.google.com`
   - Apna project select karo
   - "APIs & Services" > "Library" mein jao
   - "Firebase Cloud Messaging API" search karo
   - Enable karo agar already enabled nahi hai

---

## 🔧 Backend Setup

### Step 1: Dependencies Install Karna

1. **Backend directory mein jao:**
   ```bash
   cd rentyatra/Backend
   ```

2. **Firebase Admin SDK install karo:**
   ```bash
   npm install firebase-admin
   ```
   - Agar already installed hai, to skip karo
   - Check karo `package.json` mein:
     ```json
     "firebase-admin": "^13.5.0"
     ```

### Step 2: Firebase Admin Service Setup

1. **File check karo: `rentyatra/Backend/services/firebaseAdmin.js`**
   - Yeh file already exist karti hai
   - Isme Firebase Admin initialize hota hai
   - Service account file automatically detect hoti hai

2. **Service Account File Path:**
   - File ko `rentyatra/Backend/config/` folder mein rakho
   - File name pattern: `rentyatra-1e42a-firebase-adminsdk-*.json`
   - Code automatically is file ko detect karega

3. **Environment Variables (.env file):**
   ```env
   # Firebase Admin Configuration
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/rentyatra-1e42a-firebase-adminsdk-xxxxx-xxxxx.json
   
   # Ya full JSON as single line (production ke liye)
   # FIREBASE_CONFIG={"type":"service_account","project_id":"rentyatra-1e42a",...}
   ```

### Step 3: User Model mein FCM Tokens Field

1. **File: `rentyatra/Backend/models/User.js`**
   - Already implemented hai:
   ```javascript
   // FCM Token for push notifications (Web tokens)
   fcmTokens: {
     type: [String],
     default: [],
   },
   // FCM Token for Mobile/APK (Android/iOS)
   fcmTokenMobile: {
     type: [String],
     default: [],
   },
   ```
   - Kuch change karne ki zarurat nahi hai

### Step 4: FCM Token Save Endpoint

1. **File: `rentyatra/Backend/routes/userRoutes.js`**
   - Endpoint already implemented hai:
   - `POST /api/users/save-fcm-token` - Web tokens ke liye
   - `POST /api/users/save-fcm-token-mobile` - Mobile/APK tokens ke liye
   - `DELETE /api/users/remove-fcm-token` - Token remove karne ke liye

2. **Endpoint Details:**
   ```javascript
   // Web Token Save
   POST /api/users/save-fcm-token
   Headers: { Authorization: Bearer <JWT_TOKEN> }
   Body: { token: "fcm_token_string", platform?: "web" }
   
   // Mobile Token Save (no login required)
   POST /api/users/save-fcm-token-mobile
   Body: { token: "fcm_token_string", phone: "9876543210", platform?: "mobile" }
   ```

### Step 5: Push Notification Send Function

1. **File: `rentyatra/Backend/services/firebaseAdmin.js`**
   - Function already implemented hai: `sendPushNotification(tokens, payload)`
   - Is function ko kisi bhi controller se call kar sakte ho

2. **Usage Example:**
   ```javascript
   const { sendPushNotification } = require('../services/firebaseAdmin');
   
   // User ke tokens fetch karo
   const user = await User.findById(userId);
   const tokens = [...user.fcmTokens, ...user.fcmTokenMobile];
   
   // Duplicate tokens remove karo
   const uniqueTokens = [...new Set(tokens)];
   
   // Notification payload banao
   const payload = {
     title: "New Message",
     body: "You have a new message",
     data: {
       messageId: "msg123",
       type: "message",
       conversationId: "conv123",
       handlerName: "message",
       link: "/chat/userId"
     },
     handlerName: "message",
     link: "/chat/userId",
     icon: "/favicon.png"
   };
   
   // Notification send karo
   await sendPushNotification(uniqueTokens, payload);
   ```

### Step 6: Notification Triggers Setup

1. **Chat Message Notifications:**
   - File: `rentyatra/Backend/controllers/chatController.js`
   - `sendMessage()` function mein notification trigger hota hai
   - Already implemented hai

2. **Rental Approval Notifications:**
   - File: `rentyatra/Backend/controllers/rentalRequestController.js`
   - Admin approval par notification send hota hai
   - Already implemented hai

---

## 💻 Frontend Setup

### Step 1: Dependencies Install Karna

1. **Frontend directory mein jao:**
   ```bash
   cd rentyatra/frontend
   ```

2. **Firebase SDK install karo:**
   ```bash
   npm install firebase
   ```
   - Check karo `package.json` mein:
     ```json
     "firebase": "^12.4.0"
     ```

### Step 2: Firebase Configuration

1. **File: `rentyatra/frontend/src/firebase.js`**
   - Firebase config already setup hai
   - Firebase Console se jo config mila, wahi use karo:
   ```javascript
   import { initializeApp } from "firebase/app";
   import { getMessaging, getToken, onMessage } from "firebase/messaging";
   
   const firebaseConfig = {
     apiKey: "AIzaSyCTybWX-zsRixTgZ9q6rabPJZr9srY9S9g",
     authDomain: "rentyatra-1e42a.firebaseapp.com",
     projectId: "rentyatra-1e42a",
     storageBucket: "rentyatra-1e42a.firebasestorage.app",
     messagingSenderId: "901085016313",
     appId: "1:901085016313:web:3cfbd9d8c46c732494f228",
     measurementId: "G-00QWLKBH8W",
   };
   
   const app = initializeApp(firebaseConfig);
   const messaging = getMessaging(app);
   
   export { messaging, getToken, onMessage };
   ```

### Step 3: Service Worker File

1. **File: `rentyatra/frontend/public/firebase-messaging-sw.js`**
   - Yeh file already exist karti hai
   - Background notifications handle karti hai
   - Notification click handling bhi isme hai

2. **Service Worker Configuration:**
   - Firebase config service worker mein bhi same hona chahiye
   - VAPID key automatically Firebase SDK se handle hoti hai

3. **Important Points:**
   - Service worker file `public/` folder mein honi chahiye
   - File name exactly `firebase-messaging-sw.js` hona chahiye
   - Build ke baad bhi yeh file accessible honi chahiye

### Step 4: Push Notification Service

1. **File: `rentyatra/frontend/src/services/pushNotificationService.js`**
   - Complete implementation already hai
   - Functions available:
     - `registerServiceWorker()` - Service worker register karta hai
     - `requestNotificationPermission()` - Permission request karta hai
     - `registerFCMToken()` - FCM token generate aur backend ko save karta hai
     - `initializePushNotifications()` - Complete initialization
     - `setupForegroundNotificationHandler()` - Foreground notifications handle karta hai

2. **VAPID Key Setup:**
   - File mein VAPID key hardcoded hai:
   ```javascript
   const VAPID_KEY = 'BAXnzclIUpol3ExXQV8JokW7plpWqSJhLIFrXlnNHueIylJFuC3TQ17wWRIspB4IOmi-NffJuWq2mz9C6sC1YlQ';
   ```
   - Yeh Firebase Console se generate ki hui VAPID key hai
   - Agar change karni hai, to Firebase Console se nayi generate karo

### Step 5: App Initialization mein Push Notifications Setup

1. **Main App File: `rentyatra/frontend/src/App.jsx` ya `main.jsx`**
   - Push notifications initialize karo:
   ```javascript
   import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';
   import { useEffect } from 'react';
   
   function App() {
     useEffect(() => {
       // Initialize push notifications on app load
       initializePushNotifications();
       
       // Setup foreground notification handler
       setupForegroundNotificationHandler((payload) => {
         console.log('Notification received:', payload);
         // Custom handling if needed
       });
     }, []);
     
     // ... rest of app
   }
   ```

2. **User Login ke baad Token Register:**
   - Login successful hone ke baad:
   ```javascript
   import { registerFCMToken } from './services/pushNotificationService';
   
   // After successful login
   await registerFCMToken(true); // forceUpdate = true
   ```

### Step 6: API Configuration

1. **File: `rentyatra/frontend/src/services/api.js`**
   - API base URL check karo:
   ```javascript
   const RESOLVED_API_BASE =
     import.meta.env.VITE_API_URL ||
     (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://api.rentyatra.com/api');
   ```

2. **Environment Variables:**
   - `.env` file mein (agar needed):
   ```env
   VITE_API_URL=https://api.rentyatra.com/api
   ```

---

## 🧪 Testing & Verification

### Step 1: Local Development Testing

1. **Backend Start karo:**
   ```bash
   cd rentyatra/Backend
   npm install
   npm run dev
   ```
   - Server `http://localhost:5000` par chalega

2. **Frontend Start karo:**
   ```bash
   cd rentyatra/frontend
   npm install
   npm run dev
   ```
   - App `http://localhost:5173` par chalega

3. **Browser Console Check karo:**
   - Browser Developer Tools open karo (F12)
   - Console tab mein check karo:
     - Service worker registration logs
     - FCM token generation logs
     - Backend API call logs

### Step 2: Notification Permission Test

1. **Permission Request:**
   - App load hone par automatically permission request aayega
   - "Allow" click karo
   - Console mein success logs dikhne chahiye

2. **Manual Permission Check:**
   ```javascript
   // Browser console mein
   Notification.permission
   // Should return: "granted"
   ```

### Step 3: FCM Token Verification

1. **Token Generation Check:**
   - Console mein FCM token generate hone ke logs dekho
   - Token format: Long string starting with letters/numbers

2. **Backend Token Save Check:**
   - Console mein API call success dikhna chahiye
   - Backend logs mein token save confirmation dikhna chahiye

3. **Database Verification:**
   - MongoDB mein user document check karo:
   ```javascript
   db.users.findOne({ phone: "+919876543210" })
   // Check: user.fcmTokens array mein token hona chahiye
   ```

### Step 4: Test Notification Send

1. **Backend se Test Notification:**
   - Postman ya curl se test karo:
   ```bash
   # Chat message send karo (notification automatically trigger hoga)
   POST http://localhost:5000/api/chat/send
   Headers: { Authorization: Bearer <JWT_TOKEN> }
   Body: {
     "receiverId": "user_id",
     "content": "Test message"
   }
   ```

2. **Direct Notification Test:**
   - Backend mein test script banao:
   ```javascript
   const { sendPushNotification } = require('./services/firebaseAdmin');
   const User = require('./models/User');
   
   async function testNotification() {
     const user = await User.findById('user_id');
     const tokens = [...user.fcmTokens, ...user.fcmTokenMobile];
     const uniqueTokens = [...new Set(tokens)];
     
     await sendPushNotification(uniqueTokens, {
       title: "Test Notification",
       body: "This is a test notification",
       data: { type: "test" },
       link: "/messages"
     });
   }
   
   testNotification();
   ```

### Step 5: Foreground vs Background Testing

1. **Foreground Test:**
   - App open rakho (tab active)
   - Notification send karo
   - Foreground handler se notification show hona chahiye

2. **Background Test:**
   - App tab ko minimize karo ya background mein bhejo
   - Notification send karo
   - Browser notification show honi chahiye
   - Notification click par app open honi chahiye

### Step 6: Mobile/APK Testing

1. **Mobile WebView Test:**
   - Mobile browser mein app open karo
   - FCM token mobile endpoint se save karo:
   ```javascript
   POST /api/users/save-fcm-token-mobile
   Body: {
     "token": "fcm_token",
     "phone": "9876543210",
     "platform": "mobile"
   }
   ```

2. **Native App Integration:**
   - Agar native Android/iOS app hai, to:
   - Native FCM SDK use karo
   - Token backend ko save karo same endpoint se

---

## 🔍 Troubleshooting

### Problem 1: Service Worker Register nahi ho raha

**Symptoms:**
- Console mein "Service worker registration failed" error
- FCM token generate nahi ho raha

**Solutions:**
1. **HTTPS Check:**
   - Production mein HTTPS required hai
   - Local development mein `localhost` allowed hai
   - Agar `http://` use kar rahe ho, to `https://` ya `localhost` use karo

2. **Service Worker File Path:**
   - File `public/firebase-messaging-sw.js` mein honi chahiye
   - File name exactly match hona chahiye
   - Build ke baad file accessible honi chahiye

3. **Browser Support:**
   - Chrome, Firefox, Edge support karte hain
   - Safari mein limited support hai

### Problem 2: FCM Token Generate nahi ho raha

**Symptoms:**
- `getToken()` function error de raha hai
- Token `null` return ho raha hai

**Solutions:**
1. **VAPID Key Check:**
   - VAPID key correct hai ya nahi check karo
   - Firebase Console se nayi key generate karo agar needed

2. **Service Worker Ready:**
   - Service worker ready hone ka wait karo
   - Mobile devices par zyada time lag sakta hai

3. **Permission Check:**
   - Notification permission granted honi chahiye
   - Browser settings mein check karo

### Problem 3: Notifications Receive nahi ho rahi

**Symptoms:**
- Token save ho gaya, lekin notifications nahi aa rahi

**Solutions:**
1. **Backend Token Check:**
   - Database mein token save hai ya nahi verify karo
   - Token format correct hai ya nahi check karo

2. **Firebase Admin Setup:**
   - Service account file correct path par hai ya nahi
   - Firebase Admin properly initialize ho raha hai ya nahi

3. **Payload Structure:**
   - Notification payload correct format mein hai ya nahi
   - `title` aur `body` required fields hain

4. **Token Validity:**
   - Token expired ya invalid to nahi
   - Naya token generate karke try karo

### Problem 4: Background Notifications nahi dikh rahi

**Symptoms:**
- Foreground mein notifications aa rahi hain
- Background mein nahi aa rahi

**Solutions:**
1. **Service Worker Check:**
   - Service worker properly registered hai ya nahi
   - `firebase-messaging-sw.js` file correct hai ya nahi

2. **Browser Settings:**
   - Browser notification settings check karo
   - Site ko notification permission di hai ya nahi

3. **Payload Structure:**
   - Background notifications ke liye `notification` object required hai
   - `data` only payload background mein kaam nahi karega

### Problem 5: Notification Click par App Open nahi ho rahi

**Symptoms:**
- Notification aa rahi hai
- Click karne par kuch nahi ho raha

**Solutions:**
1. **Service Worker Click Handler:**
   - `firebase-messaging-sw.js` mein click handler check karo
   - Link correct format mein hai ya nahi

2. **Link Format:**
   - Relative paths use karo: `/chat/userId`
   - Absolute URLs bhi kaam karte hain

### Problem 6: Multiple Devices par Same Token

**Symptoms:**
- Ek user ke multiple devices par same token save ho raha hai

**Solutions:**
1. **Token Uniqueness:**
   - Har device ka apna unique token hota hai
   - Agar same token dikh raha hai, to device cache clear karo

2. **Token Array Management:**
   - Backend mein token array properly manage ho raha hai
   - Duplicate tokens remove ho rahe hain ya nahi check karo

---

## 🚀 Production Deployment

### Step 1: Environment Variables Setup

1. **Backend Production Environment:**
   ```env
   # Firebase Admin
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
   # Ya
   FIREBASE_CONFIG={"type":"service_account",...}
   
   # API URL
   FRONTEND_URL=https://www.rentyatra.com
   CORS_ORIGINS=https://www.rentyatra.com,https://rentyatra.com
   ```

2. **Frontend Production Environment:**
   ```env
   VITE_API_URL=https://api.rentyatra.com/api
   ```

### Step 2: Service Account File Deployment

1. **Production Server par:**
   - Service account JSON file server par upload karo
   - Secure location par rakho (not in public folder)
   - File permissions set karo: `chmod 600 service-account.json`

2. **Environment Variable:**
   - `.env` file mein correct path set karo
   - Ya full JSON as environment variable use karo (recommended)

### Step 3: HTTPS Setup

1. **SSL Certificate:**
   - Production domain par SSL certificate required hai
   - Service workers aur push notifications HTTPS require karte hain

2. **Domain Configuration:**
   - Firebase Console mein authorized domains add karo
   - Project Settings > General > Authorized domains

### Step 4: Build & Deploy

1. **Frontend Build:**
   ```bash
   cd rentyatra/frontend
   npm run build
   ```
   - `dist/` folder mein build files generate hongi
   - `firebase-messaging-sw.js` file bhi build mein include honi chahiye

2. **Backend Deploy:**
   - Backend server par deploy karo
   - Dependencies install karo: `npm install --production`
   - Environment variables set karo
   - Server start karo: `npm start`

### Step 5: Production Testing

1. **Live Site par Test:**
   - Production URL par app open karo
   - Console mein errors check karo
   - Notification permission request test karo
   - Test notification send karo

2. **Monitoring:**
   - Backend logs monitor karo
   - Firebase Console mein usage stats check karo
   - Error tracking setup karo

### Step 6: Firebase Console Production Settings

1. **Cloud Messaging Settings:**
   - Firebase Console > Project Settings > Cloud Messaging
   - Web Push certificates verify karo
   - API key restrictions check karo (if any)

2. **Quotas & Limits:**
   - Firebase free tier limits check karo
   - Agar zyada usage hai, to paid plan consider karo

---

## 📝 Important Notes

### Security Best Practices

1. **Service Account File:**
   - Never commit service account file to Git
   - `.gitignore` mein add karo
   - Production mein environment variables use karo

2. **VAPID Key:**
   - VAPID key public ho sakti hai (frontend mein)
   - But still, unnecessary exposure avoid karo

3. **Token Storage:**
   - Tokens database mein securely store ho rahe hain
   - Token validation backend mein karo

### Performance Considerations

1. **Token Management:**
   - Maximum 10 tokens per user (configurable)
   - Old/invalid tokens automatically remove ho jate hain

2. **Notification Batching:**
   - Multiple notifications ko batch mein send karo
   - Rate limiting consider karo

3. **Service Worker Caching:**
   - Service worker cache properly manage karo
   - Old cache clear karo when needed

### Browser Compatibility

1. **Supported Browsers:**
   - Chrome (Desktop & Mobile) ✅
   - Firefox (Desktop & Mobile) ✅
   - Edge ✅
   - Safari (Limited support) ⚠️
   - Opera ✅

2. **Mobile WebView:**
   - Android WebView ✅
   - iOS WKWebView (Limited) ⚠️

### Common Mistakes to Avoid

1. ❌ Service worker file wrong location par
2. ❌ VAPID key missing ya incorrect
3. ❌ Service account file path incorrect
4. ❌ HTTPS missing in production
5. ❌ Notification permission not requested
6. ❌ Token not saved to backend
7. ❌ Payload structure incorrect
8. ❌ CORS issues in API calls

---

## 📚 Additional Resources

1. **Firebase Documentation:**
   - https://firebase.google.com/docs/cloud-messaging

2. **Web Push Notifications:**
   - https://web.dev/push-notifications-overview/

3. **Service Workers:**
   - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

## ✅ Checklist

### Firebase Console
- [ ] Firebase project created/selected
- [ ] Web app registered
- [ ] Cloud Messaging enabled
- [ ] VAPID key generated
- [ ] Service account key downloaded
- [ ] Cloud Messaging API enabled

### Backend
- [ ] Firebase Admin SDK installed
- [ ] Service account file placed in config folder
- [ ] Environment variables configured
- [ ] Firebase Admin initialized
- [ ] FCM token save endpoint working
- [ ] Push notification send function working
- [ ] Notification triggers implemented

### Frontend
- [ ] Firebase SDK installed
- [ ] Firebase config added
- [ ] Service worker file created
- [ ] VAPID key added
- [ ] Push notification service implemented
- [ ] App initialization setup done
- [ ] Token registration on login

### Testing
- [ ] Local development tested
- [ ] Notification permission working
- [ ] FCM token generation working
- [ ] Token save to backend working
- [ ] Foreground notifications working
- [ ] Background notifications working
- [ ] Notification click handling working
- [ ] Multiple devices tested

### Production
- [ ] Environment variables set
- [ ] Service account file deployed
- [ ] HTTPS configured
- [ ] Frontend built and deployed
- [ ] Backend deployed
- [ ] Production testing done
- [ ] Monitoring setup done

---

## 🎯 Summary

Yeh complete SOP document RentYatra project mein push notifications implement karne ke liye sab kuch cover karta hai:

1. **Firebase Console Setup** - Project, app registration, keys generation
2. **Backend Setup** - Firebase Admin, token storage, notification sending
3. **Frontend Setup** - Firebase SDK, service worker, token registration
4. **Testing** - Local aur production testing
5. **Troubleshooting** - Common problems aur solutions
6. **Deployment** - Production deployment steps

**Important:** Har step carefully follow karo, kuch bhi miss mat karo. Agar koi issue aaye, to troubleshooting section check karo.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Project:** RentYatra  
**Maintained By:** Development Team

