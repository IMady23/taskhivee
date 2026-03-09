import { db } from "./config/firebase.js";

async function findMemberBug() {
    console.log("🔍 Searching for bugs reported by 'manasiwin'...");

    // Search by reportedByName (case insensitive if possible, but Firestore is exact match usually)
    // Let's just list all bugs and filter in code to be safe about case/exact keys
    const bugsSnap = await db.collection("bugs").get();

    let found = false;
    bugsSnap.forEach(doc => {
        const b = doc.data();
        if (b.reportedByName && b.reportedByName.toLowerCase().includes("manasiwin")) {
            console.log(`\n✅ FOUND BUG:`);
            console.log(`   - ID: ${doc.id}`);
            console.log(`   - Title: ${b.title}`);
            console.log(`   - TeamID: '${b.teamId}'`);
            console.log(`   - ReportedBy: ${b.reportedByName}`);
            console.log(`   - Status: ${b.status}`);
            found = true;
        }
    });

    if (!found) {
        console.log("\n❌ No bugs found for 'manasiwin'. Listing ALL bugs to debug:");
        bugsSnap.forEach(doc => {
            const b = doc.data();
            console.log(`   - [${b.reportedByName}] ${b.title} (TeamID: ${b.teamId})`);
        });
    }
}

findMemberBug();
