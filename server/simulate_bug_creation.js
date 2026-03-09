
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { createBug } from './controllers/bugController.js';

// Mock Express Request
const req = {
    user: {
        uid: 'test-member-id',
        name: 'Test Member',
        email: 'test@example.com',
        role: 'member',
        teamId: '2ouxM2yTFKcWqzpsPWFg' // The Team ID from the user's screenshot
    },
    body: {
        title: 'Test Bug from Script',
        description: 'This is a simulated bug to test notification triggers.',
        severity: 'High',
        priority: 'Urgent',
        teamId: '2ouxM2yTFKcWqzpsPWFg'
    }
};

// Mock Express Response
const res = {
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return {
            json: (data) => {
                console.log('Response JSON:', JSON.stringify(data, null, 2));
            }
        };
    }
};

console.log('--- Simulating createBug ---');
createBug(req, res).then(() => {
    console.log('--- Simulation Complete ---');
}).catch(err => {
    console.error('--- Simulation Failed ---', err);
});
