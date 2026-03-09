/**
 * Server Firebase Admin SDK initializer
 * Tries (in order):
 *  1) `server/config/serviceAccountKey.json` if present
 *  2) `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID` from env
 *  3) Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
 */

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

console.log("Current working directory:", process.cwd());
console.log("Attempting to load .env from:", path.resolve(process.cwd(), '../.env'));
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "NOT SET");

let adminApp;

const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } else {
    // Fallback to default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
    adminApp = admin.initializeApp();
  }
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', err && err.message ? err.message : err);
  const e = new Error('FIREBASE_ADMIN_NOT_CONFIGURED');
  e.code = 'FIREBASE_ADMIN_NOT_CONFIGURED';
  throw e;
}

// Client Firebase config (safe to expose to frontend)
// You can override these via environment variables in production for consistency.
export const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyACkz9WPftuqg3ZMhhPm0nbBBg7zHjqgPc',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'taskhive-92ad6.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'taskhive-92ad6',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'taskhive-92ad6.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '617950936835',
  appId: process.env.FIREBASE_APP_ID || '1:617950936835:web:4510c0ccb11fa27fb73336',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-H6XXM0B98P',
};

export const auth = admin.auth();
export const db = admin.firestore();
export { admin };
export default adminApp;
