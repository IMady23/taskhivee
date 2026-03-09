import { db } from "./config/firebase.js";

async function inspectUser() {
    console.log("🔍 Inspecting User 'Manaswini'...");
    // Try to find by name first since we don't know UID easily here
    const usersSnap = await db.collection("users").where("name", ">=", "Manas").where("name", "<=", "Manas\uf8ff").get();

    if (usersSnap.empty) {
        console.log("❌ User 'Manaswini' NOT FOUND by name search.");
        // Dump all users to see what's there
        console.log("Dumping all users:");
        const all = await db.collection("users").get();
        all.forEach(doc => console.log(` - ${doc.id}: ${JSON.stringify(doc.data())}`));
    } else {
        usersSnap.forEach(doc => {
            console.log(`✅ FOUND User: ${doc.id}`);
            console.log(doc.data());
        });
    }
}

inspectUser();
