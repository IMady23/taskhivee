import { db } from "./config/firebase.js";
import { admin } from "./config/firebase.js"; // If needed for serverTimestamp, else use Date

async function notifyLeader() {
    console.log("🔔 Preparing to notify Leader of Team GUQ5B7...");

    try {
        const teamsSnap = await db.collection("teams").where("teamId", "==", "GUQ5B7").get();

        if (teamsSnap.empty) {
            console.log("❌ Team 'GUQ5B7' not found. Please update the script with your Team ID.");
            return;
        }

        const teamDoc = teamsSnap.docs[0];
        const teamData = teamDoc.data();
        const teamId = teamDoc.id;
        const leaderId = teamData.createdBy; // Assuming createdBy is the leader for now

        console.log(`✅ Found Team: ${teamData.name} (ID: ${teamId})`);
        console.log(`👑 Leader ID: ${leaderId}`);

        if (!leaderId) {
            console.error("❌ Leader ID not found on team document.");
            return;
        }

        const notification = {
            recipientId: leaderId,
            teamId: teamId,
            type: "BUG_REPORTED",
            message: "🐞 Test Bug: Critical System Failure (Injected Script)",
            read: false,
            isRead: false,
            data: {
                bugId: "test-bug-123",
                severity: "Critical"
            },
            createdAt: new Date().toISOString()
        };

        const res = await db.collection("notifications").add(notification);
        console.log(`🚀 Notification Sent! ID: ${res.id}`);
        console.log("👉 Check the Leader Dashboard bell icon.");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

notifyLeader();
