import { db } from "./config/firebase.js";

async function findUser() {
    console.log("🔍 Searching for user 'manasiwin'...");
    const usersSnap = await db.collection("users").get();

    let found = false;
    usersSnap.forEach(doc => {
        const u = doc.data();
        // Check name or email
        if ((u.name && u.name.toLowerCase().includes("manasiwin")) ||
            (u.email && u.email.toLowerCase().includes("manasiwin"))) {
            console.log(`\n✅ FOUND USER:`);
            console.log(`   - ID: ${doc.id}`);
            console.log(`   - Name: ${u.name}`);
            console.log(`   - Role: ${u.role}`);
            console.log(`   - TeamID: '${u.teamId}'`);
            found = true;
        }
    });

    if (!found) {
        console.log("❌ User 'manasiwin' not found.");
    }
}

findUser();
