
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { db } from './config/firebase.js';
import fs from 'fs';

const TARGET_TEAM_ID = '2ouxM2yTFKcWqzpsPWFg';
const EXPECTED_LEADER_ID = 'GYbWAxzNzHugVDxJtY9zi1bKjVQM2';
const logFile = 'leader_query_results.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function verifyLeaderQuery() {
    fs.writeFileSync(logFile, ''); // Clear file
    log(`Checking for Leader in Team: ${TARGET_TEAM_ID}`);

    try {
        // Exact query used in bugController.js
        const leaderQuery = await db.collection("users")
            .where("teamId", "==", TARGET_TEAM_ID)
            .where("role", "==", "leader")
            .limit(1)
            .get();

        if (leaderQuery.empty) {
            log("❌ QUERY FAILED: No leader found for this Team ID.");

            // Debug: Why?
            log("--- Debugging ---");
            const anyUser = await db.collection("users").where("teamId", "==", TARGET_TEAM_ID).get();
            log(`Found ${anyUser.size} users in this team.`);
            anyUser.forEach(doc => {
                log(`User: ${doc.id} | Role: '${doc.data().role}'`);
            });

        } else {
            const foundId = leaderQuery.docs[0].id;
            log(`✅ QUERY SUCCESS: Found Leader ID: ${foundId}`);

            if (foundId.trim() === EXPECTED_LEADER_ID.trim()) {
                log("MATCHES EXPECTED ID! Logic is sound.");
            } else {
                log(`MISMATCH! Expected ${EXPECTED_LEADER_ID}, got ${foundId}`);
            }
        }
    } catch (error) {
        log("Script Error: " + error.message);
    }
}

verifyLeaderQuery();
