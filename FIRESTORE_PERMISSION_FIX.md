# Firestore Permission Error Fix

## Problem
Getting this error during login:
```
Firebase login error: Missing or insufficient permissions
code: 'permission-denied'
```

## Solution: Update Firestore Rules

### Go to Firebase Console

1. **Visit**: https://console.firebase.google.com/
2. **Select project**: `taskhive-92ad6`
3. **Click "Firestore Database"** in left sidebar
4. **Click "Rules"** tab at the top

### Replace with These Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write only their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Allow authenticated users to access core collections
    match /bugs/{bugId} {
      allow read, write: if request.auth != null;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    match /teams/{teamId} {
      allow read, write: if request.auth != null;
    }
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
    match /teamChats/{chatId} {
      allow read, write: if request.auth != null;
    }
    match /typingStatus/{statusId} {
      allow read, write: if request.auth != null;
    }
    match /leadershipRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Click "Publish"

### Test Login
1. Refresh browser (Ctrl+Shift+R)
2. Try logging in again
3. Should work now! ✅

## What These Rules Do

- ✅ Users can only read/write their own profile
- ✅ Authenticated users can access team data
- ✅ Secure - blocks unauthorized access
- ✅ Allows chat, tasks, bugs, notifications

## Both Rules Needed

You need BOTH:
1. **Firestore Rules** (this file) - for database access
2. **Storage Rules** (see FIREBASE_STORAGE_CORS_FIX.md) - for file uploads

## Still Having Issues?

### Clear Browser Data
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Refresh page

### Check Firebase Console
1. Go to Authentication → Users
2. Verify your user exists
3. Check the UID matches

### Verify Rules Are Published
1. Firebase Console → Firestore → Rules
2. Check "Last published" timestamp
3. Should be recent (within last few minutes)

---

**After updating both Firestore and Storage rules, everything will work! 🚀**
