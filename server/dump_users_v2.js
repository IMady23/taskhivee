
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { db } from './config/firebase.js';
import fs from 'fs';

async function dumpUsers() {
    try {
        const snapshot = await db.collection("users").get();
        const lines = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            const line = `[User] ${d.name || 'NoName'} (${d.role}) | ID: ${doc.id} | Team: ${d.teamId}`;
            lines.push(line);
            console.error(line); // Print to stderr to see immediately
        });
        fs.writeFileSync('users_dump.txt', lines.join('\n'));
        console.error(`Dumped ${lines.length} users.`);
    } catch (e) {
        console.error("Error dumping users:", e);
    }
}
dumpUsers();
