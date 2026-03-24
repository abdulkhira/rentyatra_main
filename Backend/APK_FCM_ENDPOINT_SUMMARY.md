# APK Team - FCM Token Endpoint Summary

## 🎯 Simple Answer: Sirf Ek Endpoint Chahiye!

**APK team ko sirf ek endpoint use karna hai:**

```
POST /api/users/save-fcm-token-mobile
```

---

## 📝 Kaise Use Karein?

### Request Format:
```json
{
  "token": "your_fcm_token_here",
  "phone": "9876543210",  // 10-digit phone (without +91)
  "platform": "android"   // optional
}
```

### Example (cURL):
```bash
curl -X POST https://your-backend-url.com/api/users/save-fcm-token-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123...",
    "phone": "9876543210",
    "platform": "android"
  }'
```

### Example (JavaScript/Kotlin):
```javascript
// JavaScript
fetch('https://your-backend-url.com/api/users/save-fcm-token-mobile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: fcmToken,
    phone: phoneNumber,  // 10 digits without +91
    platform: 'android'
  })
});
```

---

## ✅ Kahan Kahan Use Karein?

Yeh ek hi endpoint use karein:
- ✅ App launch par (agar phone number available hai)
- ✅ Login ke baad
- ✅ FCM token refresh hone par
- ✅ App restart par

**Ek hi endpoint se sab handle ho jayega!**

---

## ❌ Optional Endpoints (Zaroori Nahi)

Ye endpoints optional hain, agar aap chahein to use kar sakte hain:

1. **`POST /api/users/save-fcm-token`** - Login ke baad (JWT token ke saath)
   - Sirf agar aap JWT authentication prefer karte hain
   - Nahi to `/save-fcm-token-mobile` hi use karein

2. **`DELETE /api/users/remove-fcm-token`** - Logout par
   - Optional hai, tokens automatically clean ho jate hain
   - Agar explicitly remove karna hai to use karein

---

## 📋 Quick Checklist for APK Team

- [ ] FCM token get karo app mein
- [ ] Phone number get karo (user se ya saved data se)
- [ ] `POST /api/users/save-fcm-token-mobile` call karo
- [ ] Success response check karo
- [ ] Done! Push notifications ab aayenge

---

## 🔗 Full Documentation

Complete documentation ke liye dekho: `FCM_TOKEN_API_DOCUMENTATION.md`

---

## 💡 Important Points

1. **Phone Number Format**: 10 digits without +91 (e.g., "9876543210")
2. **Token Format**: Complete FCM token string (no truncation)
3. **Platform**: Optional, but recommended ("android" or "mobile")
4. **No Login Required**: Yeh endpoint login ke bina bhi kaam karta hai
5. **Multiple Devices**: Ek user ke maximum 10 devices support hote hain

---

## 🆘 Questions?

Agar koi confusion hai ya issue aaye to:
- Check `FCM_TOKEN_API_DOCUMENTATION.md` for detailed examples
- Check backend logs: `/Backend/logs/app.log`
- Contact backend team

