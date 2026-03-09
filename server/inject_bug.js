import { db } from "./config/firebase.js";

async function injectBug() {
    console.log("🔍 Searching for Team GUQ5B7...");

    try {
        const teamsSnap = await db.collection("teams").where("teamId", "==", "GUQ5B7").get();

        if (teamsSnap.empty) {
            console.log("❌ Team with code GUQ5B7 not found in DB.");
            // Fallback: List all teams to see what's there
            const allTeams = await db.collection("teams").get();
            allTeams.forEach(doc => console.log(`   Found Team: ${doc.data().name} (Code: ${doc.data().teamId}) ID: ${doc.id}`));
            return;
        }

        const teamDoc = teamsSnap.docs[0];
        const teamId = teamDoc.id;
        console.log(`✅ Found Team: ${teamDoc.data().name} (ID: ${teamId})`);

        const newBug = {
            title: "Verification Bug",
            description: "Auto-generated bug to verify Leader Dashboard display fix.",
            severity: "High",
            status: "Open",
            teamId: teamId,
            reportedByName: "Antigravity Agent",
            createdAt: new Date().toISOString()
        };

        const res = await db.collection("bugs").add(newBug);
        console.log(`🚀 Injected Bug ID: ${res.id}`);
        console.log("👉 Please refresh the Leader Dashboard to see this bug.");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

injectBug();
