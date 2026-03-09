# Firebase Storage CORS Error - Fix Guide

## Problem
Firebase Storage is blocking file uploads due to CORS policy and storage rules not being configured.

## Solution Options

### Option 1: Configure Firebase Storage Rules (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: taskhive-92ad6
3. **Navigate to Storage** (left sidebar)
4. **Click on "Rules" tab**
5. **Replace the rules with this**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload and read task submissions
    match /task-submissions/{taskId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 10 * 1024 * 1024  // Max 10MB
                   && request.resource.contentType.matches('image/.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|text/plain|application/zip|application/x-rar-compressed');
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

6. **Click "Publish"**

### Option 2: Use Firestore with Base64 (Fallback - Works Immediately)

If you can't access Firebase Console right now, I can implement a fallback that stores files as Base64 in Firestore. This works immediately but has size limitations (~1MB per file).

## Which Option Do You Prefer?

**Option 1** is better for production (proper file storage, no size limits up to 10MB)
**Option 2** works immediately without Firebase Console access (but limited to smaller files)

Let me know which you'd like to use!
