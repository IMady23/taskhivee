
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

// User ID verified from previous steps
const TARGET_USER_ID = "qrBQUyz7GxfaeyBjdK60Ji83aO";

async function testQuery() {
    const { db } = await import('./config/firebase.js');
    console.log(`Testing frontend query for user: ${TARGET_USER_ID}`);
    try {
        const output = await db.collection("notifications")
            .where("recipientId", "==", TARGET_USER_ID)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (output.empty) {
            console.log("Query returned NO documents.");
        } else {
            console.log(`Query returned ${output.size} documents.`);
            output.forEach(doc => {
                const data = doc.data();
                console.log(` - ${doc.id}: ${data.message} (${data.createdAt ? data.createdAt.toDate() : 'NULL'})`);
            });
        }
    } catch (error) {
        console.error("Query FAILED:", error);
        // 9 is FAILED_PRECONDITION in gRPC/Firebase
        if (error.code === 9 || error.message.includes("index")) {
            console.error("POTENTIAL INDEX MISSING.");
            console.error("Please create composite index: notifications [recipientId ASC/DESC, createdAt DESC]");
        }
    }
}

testQuery();
