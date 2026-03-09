
import { db } from './config/firebase.js';

async function fixData() {
    console.log('--- STARTING FIX ---');

    const teamsSnap = await db.collection('teams').get();

    for (const teamDoc of teamsSnap.docs) {
        const teamId = teamDoc.id;
        const team = teamDoc.data();
        console.log(`Processing Team: "${team.name}" (${teamId})`);

        if (team.members && Array.isArray(team.members)) {
            for (const memberId of team.members) {
                // Fetch user
                const userRef = db.collection('users').doc(memberId);
                const userSnap = await userRef.get();

                if (userSnap.exists) {
                    const user = userSnap.data();
                    if (user.teamId !== teamId) {
                        console.log(`  [FIXING] Member ${user.email} (${memberId})`);
                        console.log(`     Was: ${user.teamId} -> Now: ${teamId}`);
                        await userRef.update({ teamId: teamId });
                    } else {
                        console.log(`  [OK] Member ${user.email} is correct.`);
                    }
                } else {
                    console.log(`  [WARNING] Member ${memberId} in team list but User doc not found.`);
                }
            }
        }
    }
    console.log('--- FIX COMPLETE ---');
}

fixData().catch(console.error);
