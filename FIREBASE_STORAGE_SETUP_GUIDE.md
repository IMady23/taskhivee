# Firebase Storage Setup Guide

## 🔴 Current Status
- **Firestore Rules**: Updated (need to be published)
- **Firebase Storage**: NOT ENABLED YET
- **File Upload**: Won't work until Storage is enabled

---

## Step 1: Enable Firebase Storage

### Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: **taskhive-92ad6**
3. Click: **Build** → **Storage** (in left sidebar)
4. Click: **Get Started** button

### Choose Security Rules
When prompted, select:
- **Start in production mode** (we'll add custom rules next)
- Click **Next**

### Choose Storage Location
- Select a location close to your users (e.g., `us-central1`)
- Click **Done**

### Wait for Setup
- Firebase will create your storage bucket
- This takes 30-60 seconds
- You'll see a "Files" tab appear when ready

---

## Step 2: Update Firestore Rules (Fix Login)

### Go to Firestore Rules
1. In Firebase Console
2. Click: **Firestore Database** → **Rules** tab
3. Replace ALL existing rules with:

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

4. Click **Publish**
5. ✅ Login should now work!

---

## Step 3: Add Storage Rules (Enable File Upload)

### Go to Storage Rules
1. In Firebase Console
2. Click: **Storage** → **Rules** tab (should now be visible!)
3. Replace ALL existing rules with:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Chat file uploads - organized by team and message
    match /chat_uploads/{teamId}/{messageId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|text/plain');
    }
    
    // Task attachments
    match /tasks/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024;
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**
5. ✅ File upload should now work!

---

## Step 4: Test Everything

### Test 1: Login
1. Clear browser cache: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Go to login page
3. Enter your credentials
4. Should login successfully ✅

### Test 2: File Upload in Chat
1. Navigate to Team Chat
2. Click the **Paperclip** icon (📎)
3. Select an image or document
4. File should upload and appear in chat ✅

### Test 3: Emoji Picker
1. In Team Chat
2. Click the **Smile** icon (😊)
3. Emoji picker should appear
4. Click an emoji to insert it ✅

---

## What These Rules Do

### Firestore Rules (Database)
- ✅ Users can read/write their own profile
- ✅ Authenticated users can access team data (bugs, tasks, teams, chats)
- ✅ Blocks unauthorized access
- ✅ Allows user registration with `create` permission

### Storage Rules (Files)
- ✅ Only authenticated users can upload/download
- ✅ Max file size: 5MB
- ✅ Allowed file types: Images, PDFs, Word docs, text files
- ✅ Files organized by team and message ID
- ✅ Secure - blocks unauthorized access

---

## Troubleshooting

### "Storage Rules tab not showing"
- Make sure you completed Step 1 (Enable Storage)
- Wait 1-2 minutes after enabling
- Refresh the Firebase Console page

### "Still can't login"
- Verify Firestore rules are published (check timestamp)
- Clear ALL browser data (not just cache)
- Try in incognito/private window
- Check Firebase Console → Authentication → Users (verify your account exists)

### "File upload still failing"
- Verify Storage is enabled (check Storage → Files tab exists)
- Verify Storage rules are published
- Check file size (must be < 5MB)
- Check file type (images, PDFs, docs, text only)
- Clear browser cache completely
- Check browser console for new error messages

### "CORS error still appearing"
- This should be fixed once Storage is enabled and rules are published
- If it persists, wait 2-3 minutes for rules to propagate
- Try uploading a different file type (e.g., PNG instead of JPEG)

---

## Quick Reference

### Firebase Console URLs
- **Main Console**: https://console.firebase.google.com/
- **Your Project**: https://console.firebase.google.com/project/taskhive-92ad6
- **Firestore Rules**: Project → Firestore Database → Rules
- **Storage Rules**: Project → Storage → Rules

### File Upload Limits
- **Max Size**: 5MB per file
- **Allowed Types**: 
  - Images: JPG, PNG, GIF, WebP, etc.
  - Documents: PDF, DOC, DOCX, TXT
- **Storage Path**: `chat_uploads/{teamId}/{messageId}/{fileName}`

---

## ✅ Completion Checklist

- [ ] Step 1: Enable Firebase Storage
- [ ] Step 2: Publish Firestore rules
- [ ] Step 3: Publish Storage rules
- [ ] Step 4: Test login (should work)
- [ ] Step 5: Test file upload (should work)
- [ ] Step 6: Test emoji picker (should work)

---

**Once all steps are complete, all features will work perfectly! 🎉**
