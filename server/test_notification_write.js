import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { db, admin } from './config/firebase.js';

// Replace with a valid USER ID from your database (e.g. Leader ID)
// You can get this from list_users.js or inspect_notifications.js output if available
const TARGET_USER_ID = "qrBQUyz7GxfaeyBjdK60Ji83aO";

async function createTestNotification() {
    if (TARGET_USER_ID === "replace_with_actual_user_id") {
        console.error("Please set TARGET_USER_ID in the script before running.");
        return;
    }

    console.log(`Creating test notification for ${TARGET_USER_ID}...`);
    try {
        await db.collection("notifications").add({
            recipientId: TARGET_USER_ID,
            userId: TARGET_USER_ID, // Ensure both exist for compatibility
            type: "TEST_NOTIFICATION",
            message: "🔔 This is a verified manual test notification.",
            read: false,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("Test notification created successfully.");
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

createTestNotification();
console.log("Use a specific user ID to test.");
