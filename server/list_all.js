import { db } from "./config/firebase.js";

async function listAll() {
    console.log("--- TEAMS ---");
    const teams = await db.collection("teams").get();
    teams.forEach(doc => {
        console.log(`ID: ${doc.id} | Name: ${doc.data().name} | Code: ${doc.data().teamId}`);
    });

    console.log("\n--- BUGS ---");
    const bugs = await db.collection("bugs").get();
    bugs.forEach(doc => {
        console.log(`ID: ${doc.id} | Title: ${doc.data().title} | TeamID: ${doc.data().teamId}`);
    });
}

listAll();
