
async function testDebug() {
    console.log("Testing Debug Endpoint...");
    try {
        const response = await fetch('http://localhost:5000/api/ai/test');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);

        if (response.ok) {
            console.log("Testing Ask Endpoint...");
            const askRes = await fetch('http://localhost:5000/api/ai/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Hello' })
            });
            console.log(`Ask Status: ${askRes.status}`);
            const askText = await askRes.text();
            console.log(`Ask Response: ${askText}`);
        }

    } catch (error) {
        console.error("Fetch Error:", error.message);
    }
}

testDebug();
