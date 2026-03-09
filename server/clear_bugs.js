import { db } from "./config/firebase.js";

async function clearBugs() {
    console.log("🧹 Clearing all bugs for clean test...");
    const snapshot = await db.collection("bugs").get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("✨ All bugs deleted.");
}

clearBugs();
