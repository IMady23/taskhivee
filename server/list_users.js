import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

console.log("Loading .env from ./env");

async function listUsers() {
    const { db } = await import("./config/firebase.js");
    console.log("--- USERS ---");
    const users = await db.collection("users").get();
    users.forEach(doc => {
        const u = doc.data();
        console.log(`ID: ${doc.id} | Name: ${u.name} | Role: ${u.role} | TeamId: '${u.teamId}'`);
    });
}

listUsers();
