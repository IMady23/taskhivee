import admin from 'firebase-admin';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

// Load env from root
const envPath = path.resolve(process.cwd(), '../.env');
console.log(`Loading .env from ${envPath}`);
dotenv.config({ path: envPath });

const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

if (!admin.apps.length) {
    let credential;
    if (fs.existsSync(serviceAccountPath)) {
        console.log("Using serviceAccountKey.json");
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
        console.log("Using Env Vars");
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        });
    } else {
        console.log("Using Default Creds (likely failing if not on GCP)");
        credential = admin.credential.applicationDefault();
    }

    try {
        admin.initializeApp({ credential });
    } catch (e) {
        console.error("Init Error:", e);
    }
}

const db = admin.firestore();

const arg = process.argv[2];
if (!arg) {
    console.log("Usage: node inspect_user.js <email_or_uid>");
    process.exit(1);
}

async function inspectUser() {
    console.log(`Inspecting user: ${arg}`);
    try {
        let snapshot;
        if (arg.includes('@')) {
            snapshot = await db.collection('users').where('email', '==', arg).get();
        } else {
            snapshot = await db.collection('users').where('uid', '==', arg).get();
            // Also try doc lookup if query empty
            if (snapshot.empty) {
                const docRef = await db.collection('users').doc(arg).get();
                if (docRef.exists) {
                    // Fake a snapshot-like array
                    snapshot = [{ id: docRef.id, data: () => docRef.data() }];
                }
            }
        }

        const users = [];
        if (snapshot.forEach) {
            snapshot.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        } else if (snapshot.length) {
            users.push(snapshot[0]);
        }

        fs.writeFileSync('user.json', JSON.stringify(users, null, 2));
        console.log('Wrote to user.json');
    } catch (e) {
        console.error(e);
    }
}

inspectUser();
