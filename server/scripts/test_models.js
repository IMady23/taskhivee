import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function getModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        let output = "";
        if (data.models) {
            output += "✅ Available Models:\n";
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    output += `- ${m.name.replace('models/', '')}\n`;
                }
            });
        } else {
            output += "❌ Failed to list models: " + JSON.stringify(data, null, 2);
        }
        fs.writeFileSync('models_clean.txt', output, 'utf8');
        console.log("Done writing to models_clean.txt");
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

getModels();
