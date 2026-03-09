
import { db } from './config/firebase.js';

async function checkBugs() {
    console.log('STARTING BUG CHECK...');
    try {
        const snapshot = await db.collection('bugs').get();

        if (snapshot.empty) {
            console.log('No bugs found.');
            return;
        }

        console.log(`Found ${snapshot.size} bug documents.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Title: ${data.title}`);

            // Check if ID looks like timestamp
            if (doc.id.startsWith('177') && doc.id.length > 13) {
                console.warn('  [WARNING] ID looks like a timestamp/activity ID!');
            }
        });
        console.log('DONE BUG CHECK.');
    } catch (error) {
        console.error('Error fetching bugs:', error);
    }
}

checkBugs();
