/**
 * Firebase Configuration (Frontend)
 * Initialize Firebase SDK for authentication and Firestore
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration (use your own project to avoid "invalid credential" errors)
// Set these in client/.env - copy from client/.env.example. Get values from Firebase Console → Project settings → Your apps.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

// Require Firebase config from env to avoid "invalid credential" (hardcoded demo project is not valid)
const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missing = required.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
  throw new Error(
    `Firebase config missing: ${missing.join(', ')}. Copy client/.env.example to client/.env and set VITE_FIREBASE_* from Firebase Console → Project settings → Your apps.`
  );
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Memory Cache to avoid IndexedDB corruption issues during dev
// This fixes the "INTERNAL ASSERTION FAILED" loops
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

// Initialize Analytics only when enabled
let analytics = null;
const analyticsEnabled = import.meta.env.VITE_FIREBASE_ANALYTICS === 'true';
if (analyticsEnabled) {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    // Ignore if blocked or unavailable
  }
}

// Initialize Auth with local persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('⚠️  Failed to enable persistence:', error.message);
});

export const storage = getStorage(app);

// Initialize Realtime Database for presence tracking
export const database = getDatabase(app);

export default app;
