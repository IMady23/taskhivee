# Firebase Migration Guide - Complete Authentication System

## Overview

TaskHivee has been successfully migrated from MongoDB + JWT to **Firebase Authentication + Firestore**. This provides enterprise-grade authentication with built-in security features.

## What Changed

### Backend Changes
1. **Authentication**: Firebase Auth replaces MongoDB User model + JWT
2. **Database**: Firestore replaces MongoDB for user profiles and data
3. **Services**: Firebase Admin SDK for server-side operations
4. **Routes**: Same endpoints, now Firebase-powered

### Frontend Changes
1. **Auth Library**: Firebase SDK replaces custom JWT logic
2. **Context**: Updated to use Firebase instead of fetch-based auth
3. **State Management**: Automatic Firebase auth state listener
4. **Token Handling**: Firebase ID tokens instead of custom JWT

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name: `taskhivee`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Set Up Firebase Authentication

1. In Firebase Console, go to **Authentication** → **Get Started**
2. Enable **Email/Password** provider:
   - Click "Email/Password"
   - Toggle "Enable"
   - Uncheck "Email link (passwordless sign-in)"
   - Click "Save"

### 3. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create Database"
3. Select region closest to your users
4. Start in **Test Mode** (for development)
5. Click "Create"

### 4. Get Firebase Credentials

#### For Backend (Server)

1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file safely
5. Extract these values for `.env`:
   ```
   FIREBASE_PROJECT_ID: projects[X].projectId
   FIREBASE_PRIVATE_KEY: projects[X].private_key (replace \n with actual newlines)
   FIREBASE_CLIENT_EMAIL: projects[X].client_email
   ```

#### For Frontend (Client)

1. In **Project Settings**, scroll to **Your Apps**
2. Click the web app (</> icon)
3. Copy the config object
4. Extract these values for `.env`:
   ```
   VITE_FIREBASE_API_KEY: config.apiKey
   VITE_FIREBASE_AUTH_DOMAIN: config.authDomain
   VITE_FIREBASE_PROJECT_ID: config.projectId
   VITE_FIREBASE_STORAGE_BUCKET: config.storageBucket
   VITE_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId
   VITE_FIREBASE_APP_ID: config.appId
   ```

### 5. Configure Environment Variables

**server/.env**:
```env
PORT=5000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# CORS
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**client/.env** (in root):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=taskhivee-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskhivee-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=taskhivee-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 6. (Optional) Set Up Gmail for Email Verification

1. Enable 2-step verification on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select Mail and Windows Computer
4. Copy the generated password
5. Set `EMAIL_PASSWORD` to this app-specific password

## Architecture

### Authentication Flow

```
SIGNUP → Firebase Auth (createUserWithEmailAndPassword)
      ↓
      → Firestore User Profile Created
      ↓
      → OTP Generated & Emailed
      ↓
      → OTP Verification
      ↓
      → isEmailVerified = true
      ↓
      → Welcome Email Sent

LOGIN → Firebase Auth (signInWithEmailAndPassword)
    ↓
    → Check Firestore for isEmailVerified
    ↓
    → Return Firebase ID Token
    ↓
    → Redirect to Dashboard
```

### Database Structure (Firestore)

```
Collection: users
├─ Document: {uid}
│  ├─ uid: "firebase-uid"
│  ├─ name: "John Doe"
│  ├─ email: "john@example.com"
│  ├─ role: "leader" | "member"
│  ├─ avatar: "url" | null
│  ├─ isEmailVerified: true | false
│  ├─ otp: "123456" | null (temporary)
│  ├─ otpExpiry: Timestamp | null
│  ├─ isActive: true
│  ├─ createdAt: Timestamp
│  └─ updatedAt: Timestamp
```

## API Endpoints (No Changes in Interface)

### Authentication

```
POST   /api/auth/register-leader
POST   /api/auth/register-member
POST   /api/auth/verify-otp
POST   /api/auth/resend-otp
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me (requires Firebase ID token)
```

## Frontend Usage

### Login/Signup Flow

```jsx
const { registerLeader, verifyOTP, login } = useContext(AuthContext);

// 1. Register
const result = await registerLeader(name, email, password, confirmPassword);
// result = { userId, email, requiresOTP: true }

// 2. Verify OTP
await verifyOTP(result.userId, otp);
// User is now authenticated and redirected

// 3. Or Login Directly
const user = await login(email, password);
// Returns user profile and redirects to dashboard
```

### Protected Routes

```jsx
<Route 
  path="/leader-dashboard" 
  element={
    <RoleRoute allowedRoles={["leader", "owner", "admin"]}>
      <LeaderDashboard />
    </RoleRoute>
  } 
/>
```

## Security Features

✅ **Firebase Authentication**
- Email/Password authentication with hashing
- Automatic session management
- Built-in OAuth2 support (can be added)
- Account recovery features

✅ **Firestore Security**
- Role-based access control
- Timestamp-based OTP validation
- Email verification requirement
- Automatic token expiration (7 days)

✅ **Email Verification**
- OTP-based verification (10-minute expiry)
- Resendable codes
- Welcome emails
- Configurable email templates

## Migration from MongoDB

### What You Can Keep
- All API endpoints (same interface)
- All React components (no changes needed)
- All styling (Tailwind CSS unchanged)
- All business logic (mostly unchanged)

### What's Different
- User registration uses Firebase, not MongoDB
- No MongoDB Atlas subscription needed
- Automatic backups by Firebase
- Real-time capabilities with Firestore
- Easier scaling to production

## Firestore Vs MongoDB

| Feature | Firestore | MongoDB |
|---------|-----------|---------|
| Cost | Pay-per-read | Per-server |
| Scaling | Automatic | Manual |
| Real-time | Built-in | Socket.io |
| Auth | Built-in | Custom |
| Backups | Automatic | Manual |
| Learning Curve | Easy | Moderate |

## Testing

### Test User Accounts

After setup, create test accounts:

1. **Leader Account**
   - Email: leader@taskhivee.com
   - Password: TestPassword123!

2. **Member Account**
   - Email: member@taskhivee.com
   - Password: TestPassword123!

### Test Endpoints

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register-leader \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123","confirmPassword":"pass123"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"userId":"firebase-uid","otp":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

## Troubleshooting

### Issue: "Firebase Admin SDK initialization error"
**Solution**: Check that all `FIREBASE_*` environment variables are set correctly in `.env`

### Issue: "User profile not found"
**Solution**: Make sure Firestore user document was created during signup. Check Firestore console.

### Issue: "OTP verification failed"
**Solution**: Check that OTP hasn't expired (10 minutes). Email service might not be working. Verify email credentials.

### Issue: "CORS error in browser"
**Solution**: Ensure `VITE_API_BASE_URL` is set to `http://localhost:5000/api` in `.env`

### Issue: "Token verification failed"
**Solution**: Firebase ID tokens expire after 1 hour. Tokens refresh automatically. Clear localStorage and sign in again.

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Configure environment variables
3. ✅ Deploy backend to Firebase Functions (optional)
4. ✅ Deploy frontend to Firebase Hosting (optional)
5. ✅ Set up Firestore security rules
6. ✅ Enable additional auth methods (Google, GitHub, etc.)
7. ✅ Implement user profile management
8. ✅ Add more Firestore collections for projects, tasks, etc.

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## Support

For issues or questions:
1. Check Firestore console for errors
2. Check browser console for Firebase errors
3. Verify environment variables are set correctly
4. Check Firebase project quotas and limits
5. Review Firebase security rules

---

**Migration Status**: ✅ Complete
**Testing**: Ready for development
**Production**: Configure security rules before deployment
