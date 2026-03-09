import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // For some reason listModels is on the genAI instance or model manager?
        // Actually it is on the GoogleGenerativeAI instance? No, wait.
        // It's usually via a model manager or similar, but the SDK has changed.
        // Let's try to just use a known working model to ask for its own name or simple prompt.
        // But the user prompt said: Call ListModels to see the list of available models

        // GoogleGenerativeAI doesn't have listModels directly on the instance in some versions.
        // Let's try the direct REST API approach if the SDK doesn't expose it easily,
        // OR just try to run a generation with a very high likelihood of success model.

        console.log("Listing models via direct fetch...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        const logContent = JSON.stringify(data, null, 2);
        fs.writeFileSync('available_models.log', logContent);
        console.log("Models written to available_models.log");

    } catch (error) {
        fs.writeFileSync('available_models_error.log', error.message + '\n' + error.stack);
        console.error("Failed to list models");
    }
}

listModels();
