import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-flash-latest",
    "gemini-2.0-flash"
];

async function testModels() {
    console.log("Testing models with key: " + (API_KEY ? "Present" : "Missing"));

    for (const modelName of modelsToTest) {
        console.log(`\n--- Testing ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName}`);
            console.log("Response:", response.text());
            return; // Stop after first success? No, let's see which ones work.
            // Actually, if we return, we know the first preferred one.
        } catch (error) {
            console.log(`❌ FAILED: ${modelName}`);
            console.error("Full Error:", error);
        }
    }
}

testModels();
