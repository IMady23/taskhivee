# Firebase Setup Quick Start - 5 Minutes

## Step 1: Create Firebase Project (2 min)

1. Go to https://console.firebase.google.com/
2. Click **"Create a new project"**
3. Name: `taskhivee`
4. Click **"Create project"** (wait for setup)

## Step 2: Enable Authentication (1 min)

1. Go to **Authentication** → **Get Started**
2. Click **Email/Password**
3. Enable it → Click **Save**

## Step 3: Create Firestore Database (1 min)

1. Go to **Firestore Database**
2. Click **Create Database**
3. Choose region, then **Test Mode** → **Create**

## Step 4: Get Your Credentials (1 min)

### Server Credentials
1. **Project Settings** (gear icon) → **Service Accounts**
2. Click **Generate New Private Key**
3. Open the JSON file and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Client Credentials
1. **Project Settings** → **Your Apps** → Web icon
2. Copy the config object
3. Map to:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

## Step 5: Create .env Files

**server/.env**:
```env
PORT=5000
NODE_ENV=development

FIREBASE_PROJECT_ID=taskhivee-xxxxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@taskhivee-xxxxx.iam.gserviceaccount.com

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

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
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Step 6: Run the App

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

Visit: **http://localhost:5173**

## Done! 🎉

Your app is now using Firebase for authentication and Firestore for database!

### Key URLs
- **App**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Firebase Console**: https://console.firebase.google.com/
- **Firestore**: https://console.firebase.google.com/u/0/project/{project-id}/firestore/

### Test It
1. Click "Leader Sign Up"
2. Fill in details
3. Check email for OTP
4. Enter OTP
5. Redirect to dashboard ✅

### Troubleshooting
- **Firebase error?** → Check `.env` variables
- **OTP not arriving?** → Check EMAIL_USER/PASSWORD
- **CORS error?** → Verify VITE_API_BASE_URL
- **Firestore error?** → Check Firebase console for errors

---

**Status**: Ready to develop! 🚀
