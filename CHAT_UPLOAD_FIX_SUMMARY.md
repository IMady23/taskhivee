# Chat File Upload - CORS Error Fix

## 🔴 Current Issue
File uploads are failing with CORS error:
```
Access to XMLHttpRequest blocked by CORS policy
```

## ✅ Solution
Update Firebase Storage security rules to allow uploads from authenticated users.

## Quick Fix Steps

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Select project: **taskhive-92ad6**

### 2. Navigate to Storage Rules
- Click **Storage** in left sidebar
- Click **Rules** tab

### 3. Copy & Paste These Rules
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

### 4. Click "Publish"

### 5. Test Upload
- Refresh browser (Ctrl+Shift+R)
- Upload image in chat
- Should work now! ✅

## What Changed
- ✅ Allows authenticated users to upload
- ✅ Max 5MB file size
- ✅ Only images, PDFs, docs, text files
- ✅ Organized by team/message ID
- ✅ Secure - blocks unauthorized access

## Files Created
- `storage.rules` - Local copy of rules (deploy with `firebase deploy --only storage`)
- `FIREBASE_STORAGE_CORS_FIX.md` - Detailed guide

## After Fix
Your WhatsApp image will upload and appear in chat immediately!
