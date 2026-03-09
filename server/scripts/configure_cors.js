import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStorage } from 'firebase-admin/storage';
// Use dynamic import for config to ensure env is loaded first
const loadFirebase = async () => (await import('../config/firebase.js')).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root .env first!
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log("Env loaded. Project ID:", process.env.FIREBASE_PROJECT_ID);

// Try both common bucket names
const bucketNames = [
    'taskhive-92ad6.appspot.com',
    'taskhive-92ad6.firebasestorage.app'
];

async function configureCors() {
    try {
        const adminApp = await loadFirebase();
        const storage = getStorage(adminApp);

        const corsConfiguration = [
            {
                origin: ["http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5173"],
                method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                responseHeader: ["Content-Type", "x-goog-resumable", "Authorization"],
                maxAgeSeconds: 3600
            }
        ];

        for (const bucketName of bucketNames) {
            console.log(`\nAttempting to configure bucket: ${bucketName}`);
            try {
                const bucket = storage.bucket(bucketName);

                // Check if bucket exists
                const [exists] = await bucket.exists();
                if (!exists) {
                    console.log(`❌ Bucket ${bucketName} does not exist via Admin SDK.`);
                    continue;
                }

                await bucket.setCorsConfiguration(corsConfiguration);
                console.log(`✅ Success! CORS configuration set for ${bucketName}`);

                // Verification
                const [metadata] = await bucket.getMetadata();
                console.log('Current CORS config:', JSON.stringify(metadata.cors, null, 2));
            } catch (err) {
                console.error(`❌ Failed to configure ${bucketName}:`, err.message);
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

configureCors();
