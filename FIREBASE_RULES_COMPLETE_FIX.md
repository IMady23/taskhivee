# Complete Firebase Rules Fix - Login & File Upload

## 🔴 Current Issues
1. **Login Error**: "Missing or insufficient permissions"
2. **File Upload Error**: "Blocked by CORS policy"

## ✅ Complete Solution

You need to update **BOTH** Firebase Firestore and Storage rules.

---

## Step 1: Fix Firestore Rules (Login)

### Go to Firestore Rules
1. Visit: https://console.firebase.google.com/
2. Select: **taskhive-92ad6**
3. Click: **Firestore Database** → **Rules** tab

### Paste These Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }

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

---

## Step 2: Fix Storage Rules (File Upload)

### Go to Storage Rules
1. Same Firebase Console
2. Click: **Storage** → **Rules** tab

### Paste These Rules
```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /chat_uploads/{teamId}/{messageId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|text/plain');
    }
    
    match /tasks/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Click "Publish"

---

## Step 3: Test Everything

### Clear Browser Cache
1. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or open DevTools (F12) → Application → Clear storage

### Test Login
1. Go to login page
2. Enter credentials
3. Should login successfully ✅

### Test File Upload
1. Go to Team Chat
2. Click Paperclip icon
3. Select an image
4. Should upload and appear in chat ✅

---

## What These Rules Do

### Firestore (Database)
- ✅ Users can read/write their own profile
- ✅ Authenticated users access team data
- ✅ Secure - blocks unauthorized access

### Storage (Files)
- ✅ Only authenticated users can upload
- ✅ Max 5MB file size
- ✅ Only images, PDFs, docs, text
- ✅ Organized by team/message

---

## Troubleshooting

### Still Can't Login?
1. Check Firebase Console → Authentication → Users
2. Verify your email is listed
3. Try password reset if needed
4. Clear all browser data and try again

### Still Can't Upload Files?
1. Check file size (must be < 5MB)
2. Check file type (images, PDF, docs, text only)
3. Verify you're logged in
4. Check browser console for errors

### Rules Not Working?
1. Verify both rules are published (check timestamps)
2. Wait 1-2 minutes for rules to propagate
3. Clear browser cache completely
4. Try in incognito/private window

---

## Quick Deploy (If You Have Firebase CLI)

If you have Firebase CLI installed, you can deploy both rules at once:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules  
firebase deploy --only storage

# Or deploy both
firebase deploy --only firestore:rules,storage
```

---

## Files Created

Local copies of rules (for reference):
- `firestore.rules` - Database rules
- `storage.rules` - File storage rules

---

**After updating both rules, login and file upload will work perfectly! 🎉**
