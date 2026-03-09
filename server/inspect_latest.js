import { db } from "./config/firebase.js";

async function inspectLatestBug() {
    console.log("🔍 Inspecting latest bugs...");

    const bugsSnap = await db.collection("bugs").orderBy("createdAt", "desc").limit(5).get();

    bugsSnap.forEach(doc => {
        const b = doc.data();
        console.log(`\n🐛 BUG ID: ${doc.id}`);
        console.log(`   - Title: ${b.title}`);
        console.log(`   - Description: ${b.description}`);
        console.log(`   - TeamID: ${b.teamId}`);
        console.log(`   - ReportedByName: '${b.reportedByName}' (Type: ${typeof b.reportedByName})`);
        console.log(`   - ReportedById: ${b.reportedById}`);
        console.log(`   - CreatedAt:`, b.createdAt);
        console.log(`   - CreatedAt Type: ${typeof b.createdAt}`);
        if (b.createdAt && b.createdAt.toDate) {
            console.log(`   - CreatedAt (Is Timestamp): YES`);
        } else {
            console.log(`   - CreatedAt (Is Timestamp): NO`);
        }
    });
}

inspectLatestBug();
