
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

console.log("Loading .env from ./env");

async function listNotifications() {
    const { db } = await import("./config/firebase.js");
    console.log("Fetching latest 10 notifications...");
    try {
        const snapshot = await db.collection("notifications")
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();

        if (snapshot.empty) {
            console.log("No notifications found.");
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`[${doc.id}]`);
            console.log(`  recipientId: ${data.recipientId}`);
            console.log(`  userId: ${data.userId}`);
            console.log(`  type: ${data.type}`);
            console.log(`  message: ${data.message}`);
            // Handle createdAt being a Firestore Timestamp or Date or null
            let dateStr = 'NULL';
            if (data.createdAt) {
                if (data.createdAt.toDate) {
                    dateStr = data.createdAt.toDate().toISOString();
                } else if (data.createdAt instanceof Date) {
                    dateStr = data.createdAt.toISOString();
                } else {
                    dateStr = String(data.createdAt);
                }
            }
            console.log(`  createdAt: ${dateStr}`);
            console.log("------------------------------------------------");
        });
    } catch (error) {
        console.error("Error listing notifications:", error);
    }
}

listNotifications();
