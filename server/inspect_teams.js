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

async function inspectTeams() {
    console.log('Inspecting Teams and Invites...');
    try {
        const snapshot = await db.collection('teams').get();
        const teams = [];

        snapshot.forEach(doc => {
            teams.push({
                id: doc.id,
                ...doc.data()
            });
        });

        fs.writeFileSync('teams.json', JSON.stringify(teams, null, 2));
        console.log('Wrote to teams.json');
    } catch (e) {
        console.error(e);
    }
}

inspectTeams();
