import { db, admin } from "../config/firebase.js";

// Temporary endpoint to clear notifications for testing
export const clearAllNotifications = async (req, res) => {
    try {
        console.log("Clearing all notifications via API...");
        const snapshot = await db.collection("notifications").get();

        if (snapshot.empty) {
            return res.status(200).json({ message: "No notifications to clear." });
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Deleted ${snapshot.size} notifications.`);
        res.status(200).json({ message: `Cleared ${snapshot.size} notifications.` });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ message: "Failed to clear notifications", error: error.message });
    }
};

export const createNotification = async (userId, teamId, type, message) => {
    try {
        if (!userId || !teamId || !message) {
            console.warn("Skipping notification creation: Missing fields", { userId, teamId, type });
            return;
        }

        await db.collection("notifications").add({
            userId,      // Standard field for queries
            recipientId: userId, // Backward compatibility
            teamId,
            type,
            message,
            read: false, // Standard field
            isRead: false, // Backward compatibility
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[Notification] Created for ${userId}: ${type}`);
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};
