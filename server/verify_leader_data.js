
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { db } from './config/firebase.js';
import fs from 'fs';

const logFile = 'leader_verification.log';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function verifyTeamAndLeader() {
    fs.writeFileSync(logFile, ''); // Clear
    log("Verifying Team and User Data for Notifications...");
    try {
        // 1. Fetch Users to find a Leader and their Team
        const usersSnap = await db.collection("users")
            .where("role", "==", "leader")
            .limit(5)
            .get();

        if (usersSnap.empty) {
            log("No LEADER users found.");
            return;
        }

        // Loop through leaders to find one with a valid team
        for (const leaderDoc of usersSnap.docs) {
            const leader = leaderDoc.data();
            log(`------------------------------------------------`);
            log(`[USER] Leader: ${leader.name} (ID: ${leaderDoc.id})`);
            log(`       TeamID: ${leader.teamId}`);

            if (leader.teamId) {
                // 2. Fetch Team Details
                const teamDoc = await db.collection("teams").doc(leader.teamId).get();
                if (teamDoc.exists) {
                    log(`[TEAM] Name: ${teamDoc.data().name} (ID: ${teamDoc.id})`);
                    log(`[TEAM] Stored Leader ID: ${teamDoc.data().leaderId}`);

                    if (teamDoc.data().leaderId !== leaderDoc.id) {
                        log(`⚠️ MISMATCH: Team LeaderID (${teamDoc.data().leaderId}) != User ID (${leaderDoc.id})`);
                    } else {
                        log(`✅ MATCH: Team LeaderID matches User ID`);
                    }
                } else {
                    // Try query if doc ID isn't teamId
                    const teamQuery = await db.collection("teams").where("teamId", "==", leader.teamId).get();
                    if (!teamQuery.empty) {
                        log(`[TEAM] Found via field: ${teamQuery.docs[0].data().name}`);
                    } else {
                        log(`[TEAM] Not found!`);
                    }
                }
            }
        }
    } catch (error) {
        log("Verification failed: " + error.message);
    }
}

verifyTeamAndLeader();
