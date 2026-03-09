
import { db } from './config/firebase.js';

async function inspectData() {
    console.log('--- INSPECTION ---');

    const usersSnap = await db.collection('users').get();
    const users = {};
    usersSnap.forEach(doc => users[doc.id] = { id: doc.id, ...doc.data() });

    const teamsSnap = await db.collection('teams').get();

    teamsSnap.forEach(teamDoc => {
        const team = teamDoc.data();
        console.log(`\nTeam Name: "${team.name}" (DocId: ${teamDoc.id}, Code: ${team.teamId})`);

        if (team.members) {
            team.members.forEach(memberId => {
                const user = users[memberId];
                if (user) {
                    const match = user.teamId === teamDoc.id;
                    if (!match) {
                        console.log(`  [MISMATCH] Member ${user.email} (${user.id})`);
                        console.log(`     User.teamId: ${user.teamId}`);
                        console.log(`     Team.docId:  ${teamDoc.id}`);
                    } else {
                        console.log(`  [OK] Member ${user.email}`);
                    }
                } else {
                    console.log(`  [MISSING] MemberID ${memberId} not found in Users`);
                }
            });
        }
    });

    console.log('\n--- TARGET USER CHECK ---');
    // Check specifically for the user in screenshot
    Object.values(users).forEach(u => {
        if (u.email && u.email.includes('thelastcall')) {
            console.log(`Found Target User: ${u.email}`);
            console.log(`  TeamId: ${u.teamId}`);
        }
    });
}

inspectData().catch(console.error);
