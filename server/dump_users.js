
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { db } from './config/firebase.js';
import fs from 'fs';

async function dumpUsers() {
    try {
        const snapshot = await db.collection("users").get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        fs.writeFileSync('users_dump.json', JSON.stringify(users, null, 2));
        console.log(`Dumped ${users.length} users to users_dump.json`);
    } catch (e) {
        console.error(e);
    }
}
dumpUsers();
