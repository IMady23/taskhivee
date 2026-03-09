import { db } from "./config/firebase.js";

async function dumpBugs() {
    console.log("--- BUGS DUMP ---");
    const bugs = await db.collection("bugs").get();
    bugs.forEach(doc => {
        const b = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Title: ${b.title}`);
        console.log(`  TeamId: ${b.teamId}`);
        console.log(`  ReportedBy: ${b.reportedByName}`);
        console.log("--------------------------------");
    });
}

dumpBugs();
