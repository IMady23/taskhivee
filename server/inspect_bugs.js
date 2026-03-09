import { db } from "./config/firebase.js";

async function inspectMemberBugs() {
    console.log("🔍 Inspecting bugs for 'Manaswini'...");

    const bugsSnap = await db.collection("bugs").get();

    let found = false;
    bugsSnap.forEach(doc => {
        const b = doc.data();
        // Check vaguely for name match
        if (b.reportedByName && b.reportedByName.toLowerCase().includes("manas")) {
            console.log(`\n🐛 BUG FOUND: ${doc.id}`);
            console.log(`   - Title: ${b.title}`);
            console.log(`   - TeamID: '${b.teamId}' (Type: ${typeof b.teamId})`);
            console.log(`   - ReportedBy: ${b.reportedByName} (ID: ${b.reportedById})`);
            console.log(`   - CreatedAt: ${b.createdAt ? b.createdAt.toDate() : 'MISSING'}`);
            found = true;
        }
    });

    if (!found) {
        console.log("❌ No bugs found for Manaswini.");
    }
}

inspectMemberBugs();
