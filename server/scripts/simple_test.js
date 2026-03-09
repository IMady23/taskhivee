import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    const logFile = 'simple_test_output.log';
    fs.writeFileSync(logFile, "Starting test...\n");

    const modelsToTry = [
        "gemini-pro",
        "gemini-pro-latest"
    ];

    for (const modelName of modelsToTry) {
        try {
            fs.appendFileSync(logFile, `\n--- Testing model: ${modelName} ---\n`);

            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello?");
            const response = await result.response;
            const text = response.text();

            fs.appendFileSync(logFile, `✅ SUCCESS! Response: ${text}\n`);
            console.log(`✅ ${modelName} passed.`);

        } catch (error) {
            fs.appendFileSync(logFile, `❌ FAILED. Error: ${error.message}\n`);
            console.log(`❌ ${modelName} failed.`);
        }
    }
}

test();
