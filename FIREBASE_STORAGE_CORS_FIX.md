# Firebase Storage CORS Fix

## Problem
You're getting this error:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

This means Firebase Storage is blocking uploads from your localhost development server.

## Solution: Update Firebase Storage Rules

### Option 1: Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `taskhive-92ad6`

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "Rules" tab at the top

3. **Update the Rules**
   Replace the existing rules with:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to chat_uploads
    match /chat_uploads/{teamId}/{messageId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|text/plain');
    }
    
    // Allow authenticated users to upload task attachments
    match /tasks/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Click "Publish"**
   - Review the changes
   - Click "Publish" to apply

### Option 2: Using Firebase CLI

If you have Firebase CLI installed:

1. **Update `storage.rules` file** (create if it doesn't exist):

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

2. **Deploy the rules**:
```bash
firebase deploy --only storage
```

## What These Rules Do

### Security Features:
- ✅ Only authenticated users can upload
- ✅ Max file size: 5MB
- ✅ Only allowed file types (images, PDFs, docs, text)
- ✅ Files organized by team and message ID
- ✅ All other paths are blocked

### File Paths Allowed:
- `chat_uploads/{teamId}/{messageId}/{fileName}` - Chat files
- `tasks/{userId}/{fileName}` - Task attachments

## Testing After Fix

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Try uploading the image again**
3. **Check console** - You should see:
   - `📎 File selected: WhatsApp Image...`
   - `📤 Starting upload for team: ...`
   - `✅ Upload complete!`
   - Image appears in chat!

## Still Not Working?

### Check Firebase Storage is Enabled

1. Go to Firebase Console → Storage
2. If you see "Get Started", click it to enable Storage
3. Choose your location (same as Firestore)
4. Click "Done"

### Verify Environment Variables

Check `client/.env` has:
```
VITE_FIREBASE_STORAGE_BUCKET=taskhive-92ad6.firebasestorage.app
```

### Check Authentication

Make sure you're logged in:
- You should see your name in the top right
- Logout button should be visible

## Alternative: Temporary Open Rules (Development Only)

⚠️ **WARNING: Only use for testing, NOT for production!**

If you just want to test quickly:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to upload anything. Use the secure rules above for production!

## Need More Help?

If you're still having issues:

1. Check Firebase Console → Storage → Files
   - Do you see a `chat_uploads` folder?
   - Are there any files in it?

2. Check browser console for other errors

3. Try uploading a smaller file (< 1MB)

4. Verify your Firebase project ID matches in `.env`

---

**Once you update the rules, file uploads will work perfectly! 🚀**
