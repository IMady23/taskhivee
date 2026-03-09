
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { db, admin } from './config/firebase.js';

async function broadcastToLeaders() {
    try {
        console.log("Broadcasting test notification to ALL leaders...");
        const usersSnap = await db.collection("users")
            .where("role", "==", "leader")
            .get();

        if (usersSnap.empty) {
            console.log("No leaders found!");
            return;
        }

        const batch = db.batch();
        let count = 0;

        usersSnap.forEach(doc => {
            const user = doc.data();
            const notifRef = db.collection("notifications").doc();
            batch.set(notifRef, {
                recipientId: doc.id,
                userId: doc.id, // Compat
                teamId: user.teamId || 'unknown',
                type: "SYSTEM_BROADCAST",
                message: `🔔 System Test: Broadcast to ${user.name}`,
                read: false,
                isRead: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Prepared for: ${user.name} (${doc.id})`);
            count++;
        });

        await batch.commit();
        console.log(`Successfully sent ${count} notifications.`);
    } catch (error) {
        console.error("Broadcast failed:", error);
    }
}

broadcastToLeaders();
