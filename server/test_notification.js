import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function testNotification() {
    const { db } = await import('./config/firebase.js');

    const leaderId = process.argv[2] || "TEST_LEADER_ID";
    const teamId = process.argv[3] || "TEST_TEAM";

    console.log(`Sending test notification to ${leaderId} in team ${teamId}...`);

    try {
        const res = await db.collection('notifications').add({
            userId: leaderId,
            recipientId: leaderId,
            teamId: teamId,
            type: 'BUG_REPORTED', // Use a real type so frontend reacts
            message: 'This is a REAL-TIME test notification from the server script',
            read: false,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log("Notification sent! ID:", res.id);
        console.log("Check LeaderDashboard for a bug report notification.");
    } catch (e) {
        console.error("Failed to send:", e);
    }
}

testNotification();
