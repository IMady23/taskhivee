
import { db } from './config/firebase.js';

async function debugData() {
    console.log("--- USERS ---");
    try {
        const users = await db.collection('users').get();
        if (users.empty) {
            console.log("No users found.");
        } else {
            users.forEach(doc => {
                const d = doc.data();
                console.log(`User: ${d.name} (${d.email}) | Role: ${d.role} | TeamID: ${d.teamId} | ID: ${doc.id}`);
            });
        }

        console.log("\n--- BUGS ---");
        const bugs = await db.collection('bugs').get();
        if (bugs.empty) {
            console.log("No bugs found.");
        } else {
            bugs.forEach(doc => {
                const d = doc.data();
                console.log(`Bug: ${d.title} | TeamID: ${d.teamId} | ReportedBy: ${d.reportedByEmail} | Status: ${d.status}`);
            });
        }
    } catch (error) {
        console.error("Error reading DB:", error);
    }
}

debugData().then(() => process.exit(0));
