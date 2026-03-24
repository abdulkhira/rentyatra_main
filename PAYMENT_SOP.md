# RentYatra Payment System - Standard Operating Procedure (SOP)

## 📋 Table of Contents
1. [Overview](#overview)
2. [Payment Architecture](#payment-architecture)
3. [Payment Types](#payment-types)
4. [Payment Flow - Web](#payment-flow---web)
5. [Payment Flow - Mobile App (APK)](#payment-flow---mobile-app-apk)
6. [Payment Verification Process](#payment-verification-process)
7. [Payment Issues & Solutions](#payment-issues--solutions)
8. [Best Practices](#best-practices)
9. [API Endpoints](#api-endpoints)
10. [Database Models](#database-models)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

RentYatra uses **Razorpay** as the payment gateway for processing both **Subscription** and **Boost** payments. The system is designed to work seamlessly on both **Web** and **Mobile App (APK)** platforms.

### Key Features:
- ✅ Razorpay integration for secure payments
- ✅ Support for Web and Mobile App (APK/WebView)
- ✅ Subscription payments (monthly/yearly plans)
- ✅ Boost package payments (one-time purchases)
- ✅ Automatic payment verification
- ✅ Duplicate payment prevention
- ✅ Payment status tracking
- ✅ GST calculation (18% for boost payments)

---

## Payment Architecture

### Technology Stack:
- **Payment Gateway**: Razorpay
- **Backend**: Node.js/Express
- **Frontend**: React (Web) + Flutter WebView (Mobile App)
- **Database**: MongoDB

### Payment Flow Diagram:
```
User → Frontend → Razorpay → Backend Verification → Database Update → User Notification
```

---

## Payment Types

### 1. Subscription Payments
- **Purpose**: Monthly/Yearly subscription plans for listing products
- **Model**: `Subscription` (MongoDB)
- **Features**:
  - Auto-renewal support
  - Multiple plan tiers
  - Max listings/photos limits
  - Payment status tracking

### 2. Boost Payments
- **Purpose**: One-time purchase of boost credits for product visibility
- **Model**: `BoostPurchase` (MongoDB)
- **Features**:
  - Multiple boost packages
  - GST calculation (18%)
  - Credit addition to user account
  - Usage tracking

---

## Payment Flow - Web

### Step-by-Step Process:

#### 1. **User Initiates Payment**
- User selects a subscription plan or boost package
- Frontend calls `createSubscription()` or `createBoostPaymentOrder()`
- Subscription/BoostPurchase record created in database with status: `pending`

#### 2. **Create Razorpay Order**
- Frontend calls `/api/payment/create-order` (for subscriptions)
- OR `/api/boost/create-payment-order` (for boosts)
- Backend creates Razorpay order with:
  - Amount in paise (₹1 = 100 paise)
  - Currency: INR
  - Notes: subscription_id, user_id, plan_id, etc.
- **Order ID stored in subscription/boost record**

#### 3. **Open Razorpay Checkout**
- Frontend loads Razorpay script: `https://checkout.razorpay.com/v1/checkout.js`
- Creates Razorpay instance with:
  - Razorpay Key ID
  - Order ID
  - Amount
  - Callback URL (for redirect mode)
  - User prefill data
- Opens Razorpay payment modal

#### 4. **User Completes Payment**
- User enters payment details (Card/UPI/Netbanking/Wallet)
- Razorpay processes payment
- Payment handler receives response with:
  - `razorpay_order_id`
  - `razorpay_payment_id`
  - `razorpay_signature`

#### 5. **Payment Verification**
- Frontend calls `/api/payment/verify` (subscriptions)
- OR `/api/boost/verify-payment` (boosts)
- Backend verifies:
  - Signature verification (HMAC SHA256)
  - Razorpay API verification (if signature missing)
  - Payment status check (captured/authorized)

#### 6. **Database Update**
- Subscription/BoostPurchase status updated to `paid`
- Payment ID and Order ID stored
- Subscription activated OR Boost credits added to user
- Email notification sent (async)

#### 7. **Success Response**
- Frontend receives verification success
- User redirected to success page
- Payment info cleared from localStorage

---

## Payment Flow - Mobile App (APK)

### Key Differences from Web:

#### 1. **WebView Context Detection**
```javascript
// Detects if running in APK/WebView
isAPKContext() {
  return /wv|WebView/i.test(userAgent) || 
         window.flutter_inappwebview !== undefined ||
         window.cordova !== undefined;
}
```

#### 2. **Redirect Mode (Required)**
- **Web**: Modal mode (payment popup)
- **APK**: Redirect mode (full page redirect)
- **Why**: WebView doesn't support iframe/popup restrictions

#### 3. **Callback URL Handling**
- Razorpay redirects to: `/api/payment/razorpay-callback`
- Backend extracts payment details from URL params
- Backend redirects to frontend: `/payment-callback?order_id=...&payment_id=...`

#### 4. **Payment Data Storage**
- Payment info stored in `localStorage` before redirect:
```javascript
localStorage.setItem('pending_payment', JSON.stringify({
  type: 'subscription',
  orderId: order.id,
  subscriptionId: subscription.subscriptionId,
  // ...
}));
```

#### 5. **Payment Verification**
- Frontend retrieves payment data from:
  - URL parameters (from backend redirect)
  - localStorage (fallback)
- Calls verification API
- Handles missing signature (backend verifies via Razorpay API)

---

## Payment Verification Process

### Backend Verification Logic:

#### 1. **Signature Verification** (Primary Method)
```javascript
// HMAC SHA256 signature verification
const body = `${razorpay_order_id}|${razorpay_payment_id}`;
const expectedSignature = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(body)
  .digest("hex");
  
const isValid = expectedSignature === razorpay_signature;
```

#### 2. **Razorpay API Verification** (Fallback for APK)
- Used when signature is missing/empty
- Fetches payment from Razorpay API
- Checks payment status: `captured` or `authorized`
- Verifies order ID matches

#### 3. **Order Status Verification**
- Fetches order from Razorpay
- Checks: `order.status === 'paid'` AND `order.amount_paid >= order.amount`
- Extracts payment_id from order.payments array

### Verification Priority:
1. **Signature verification** (if signature provided)
2. **Razorpay API verification** (if signature missing)
3. **Order status verification** (if payment_id missing)

---

## Payment Issues & Solutions

### Issue 1: Payment ID Missing in APK
**Problem**: Razorpay redirect doesn't include payment_id in URL

**Solution**:
- Backend fetches payment_id from Razorpay order
- Order.payments array contains payment details
- Fallback: Use subscription.orderId to fetch order

**Code Location**: `paymentController.js` lines 505-545

### Issue 2: Signature Missing in WebView
**Problem**: Razorpay doesn't provide signature in redirect mode

**Solution**:
- Backend verifies via Razorpay API instead
- Checks payment status: `captured` or `authorized`
- Validates order_id matches

**Code Location**: `paymentController.js` lines 636-960

### Issue 3: Duplicate Payment Verification
**Problem**: User refreshes callback page, causing duplicate verification

**Solution**:
- Frontend tracks processed payments in localStorage
- Backend checks if payment already verified
- Returns success if already processed

**Code Location**: `PaymentCallback.jsx` lines 194-212

### Issue 4: Order ID Missing
**Problem**: Order ID not stored in subscription before payment

**Solution**:
- Order ID stored immediately when order is created
- Stored in subscription.notes.subscription_id
- Backend updates subscription.orderId on order creation

**Code Location**: `paymentController.js` lines 71-115

### Issue 5: Payment Timeout
**Problem**: Verification takes too long, user sees error

**Solution**:
- Frontend timeout: 20s (web), 30s (APK)
- Backend handles async operations
- User-friendly timeout message

**Code Location**: `razorpayService.js` lines 732-769

---

## Best Practices

### 1. **Always Store Order ID Immediately**
```javascript
// When creating order, update subscription immediately
if (notes && notes.subscription_id) {
  subscription.orderId = order.id;
  await subscription.save();
}
```

### 2. **Handle Missing Payment Data Gracefully**
```javascript
// Support multiple parameter formats
const orderId = req.body.razorpay_order_id || 
                req.body.orderId || 
                req.body.order_id;
```

### 3. **Use Redirect Mode for APK**
```javascript
// Always use redirect mode in WebView
const useRedirectMode = isAPK || isInIframe;
if (useRedirectMode) {
  options.redirect = true;
  options.callback_url = callbackUrl;
}
```

### 4. **Prevent Duplicate Verifications**
```javascript
// Check if already processed
if (subscription.paymentStatus === 'paid') {
  return res.json({ success: true, message: 'Already processed' });
}
```

### 5. **Log All Payment Operations**
```javascript
// Comprehensive logging for debugging
console.log('Payment verification:', {
  orderId, paymentId, hasSignature, subscriptionId
});
```

### 6. **Handle Errors Gracefully**
```javascript
// User-friendly error messages
if (error.message.includes('timeout')) {
  errorMessage = 'Payment verification is taking longer than expected...';
}
```

---

## API Endpoints

### Payment Endpoints:

#### 1. **Create Order**
```
POST /api/payment/create-order
Body: { amount, currency, receipt, notes }
Response: { orderId, amount, currency }
```

#### 2. **Verify Payment**
```
POST /api/payment/verify
Body: { 
  razorpay_order_id, 
  razorpay_payment_id, 
  razorpay_signature,
  subscriptionId 
}
Response: { success, data: { paymentId, orderId, subscription } }
```

#### 3. **Create Subscription**
```
POST /api/payment/create-subscription
Body: { userId, planId, planName, price, maxListings, maxPhotos }
Response: { subscriptionId, status }
```

#### 4. **Razorpay Callback** (Redirect Handler)
```
ALL /api/payment/razorpay-callback
Query: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
Response: Redirect to /payment-callback
```

### Boost Endpoints:

#### 1. **Create Boost Payment Order**
```
POST /api/boost/create-payment-order
Body: { packageId, packageName, boostCount, price }
Response: { orderId, amount, purchaseId }
```

#### 2. **Verify Boost Payment**
```
POST /api/boost/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
Response: { boostCount, creditsAdded, paymentStatus }
```

---

## Database Models

### Subscription Model:
```javascript
{
  userId: ObjectId,
  planId: String,
  planName: String,
  status: 'active' | 'expired' | 'cancelled' | 'pending',
  startDate: Date,
  endDate: Date,
  price: Number,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  orderId: String,        // Razorpay order ID
  paymentId: String,     // Razorpay payment ID
  paymentCompletedAt: Date,
  maxListings: Number,
  maxPhotos: Number
}
```

### BoostPurchase Model:
```javascript
{
  user: ObjectId,
  packageId: String,
  packageName: String,
  boostCount: Number,
  price: Number,
  gstAmount: Number,
  totalAmount: Number,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  status: 'pending' | 'completed' | 'failed' | 'cancelled',
  creditsAdded: Number,
  source: 'web' | 'mobile_apk'
}
```

---

## Troubleshooting Guide

### Problem: Payment Not Verified
**Check**:
1. Razorpay keys configured correctly
2. Order ID stored in subscription
3. Payment ID format valid (`pay_...`)
4. Signature verification working
5. Backend logs for errors

### Problem: APK Payment Fails
**Check**:
1. Redirect mode enabled
2. Callback URL correct
3. localStorage accessible
4. WebView context detected
5. Payment data in URL params

### Problem: Duplicate Payments
**Check**:
1. Duplicate prevention logic
2. Payment status check
3. Processed payments tracking
4. Database constraints

### Problem: Payment Timeout
**Check**:
1. Network connectivity
2. Razorpay API status
3. Backend response time
4. Timeout settings
5. Async operations blocking

---

## Security Considerations

### 1. **Never Expose Secret Key**
- Secret key only on backend
- Frontend uses Key ID only

### 2. **Always Verify Signature**
- Verify on backend, never trust frontend
- Use Razorpay API as fallback

### 3. **Validate Payment Amount**
- Verify amount matches order
- Check for amount tampering

### 4. **Idempotency**
- Prevent duplicate processing
- Use payment_id as unique identifier

### 5. **Error Handling**
- Don't expose sensitive errors
- Log errors securely
- User-friendly messages

---

## Testing

### Test Cards (Razorpay Test Mode):
- **Success**: `4111111111111111` (Visa)
- **Success**: `5105105105105100` (Mastercard)
- **Success UPI**: `success@razorpay`
- **Failure**: `4111111111111112`

### Test Scenarios:
1. ✅ Successful payment (web)
2. ✅ Successful payment (APK)
3. ✅ Payment with missing signature
4. ✅ Payment with missing payment_id
5. ✅ Duplicate payment prevention
6. ✅ Payment timeout handling
7. ✅ Payment failure handling
8. ✅ Subscription activation
9. ✅ Boost credits addition

---

## Conclusion

The RentYatra payment system is **properly implemented** with:
- ✅ Comprehensive error handling
- ✅ Web and APK support
- ✅ Duplicate prevention
- ✅ Secure verification
- ✅ Proper logging
- ✅ User-friendly error messages

### Key Strengths:
1. **Robust verification** - Multiple fallback methods
2. **APK compatibility** - Redirect mode with proper handling
3. **Data integrity** - Order ID stored immediately
4. **User experience** - Clear error messages and status updates

### Areas for Improvement:
1. Add webhook support for payment status updates
2. Implement payment retry mechanism
3. Add payment analytics dashboard
4. Implement refund handling
5. Add payment method preferences

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: RentYatra Development Team

