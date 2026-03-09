
// Uses Node.js global fetch (Node 18+)
async function testAI() {
    console.log("Testing AI Endpoint...");
    try {
        const response = await fetch('http://localhost:5000/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Hello' })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log("Full Error:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(`Response Text: ${text}`);
        }

    } catch (error) {
        console.error("Fetch Error:", error.message);
    }
}

testAI();
