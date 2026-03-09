import admin from 'firebase-admin';
import { resolve } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = 'c:/Projectcolab3/.env';
console.log(`Checking for .env at: ${envPath}`);
if (fs.existsSync(envPath)) {
    console.log('.env file found.');
    dotenv.config({ path: envPath });
} else {
    console.log('.env file NOT found at absolute path.');
}

const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'taskhive-92ad6.firebasestorage.app';

async function setCors() {
    try {
        console.log(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log(`Private Key present: ${!!process.env.FIREBASE_PRIVATE_KEY}`);

        const rawKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!rawKey) throw new Error("FIREBASE_PRIVATE_KEY is missing");

        const privateKey = rawKey.replace(/\\n/g, '\n').replace(/"/g, '');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                storageBucket: bucketName
            });
        }

        const bucket = admin.storage().bucket(bucketName);

        const corsConfiguration = [
            {
                origin: ["*"], // Temporarily use wildcard to ensure it works, then we can restrict
                method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                responseHeader: ["Content-Type", "x-goog-resumable", "Authorization"],
                maxAgeSeconds: 3600
            }
        ];

        console.log(`Setting CORS for bucket: ${bucketName}...`);
        await bucket.setCorsConfiguration(corsConfiguration);
        console.log('✅ CORS configuration set successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting CORS:', error.stack || error.message || error);
        process.exit(1);
    }
}

setCors();
