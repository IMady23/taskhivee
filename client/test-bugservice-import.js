// Test file to verify bugService exports
import { createBug, getTeamBugs, updateBugStatus, subscribeToTeamBugs, deleteBug } from './src/services/bugService.js';

console.log('✅ All bugService exports loaded successfully!');
console.log('createBug:', typeof createBug);
console.log('getTeamBugs:', typeof getTeamBugs);
console.log('updateBugStatus:', typeof updateBugStatus);
console.log('subscribeToTeamBugs:', typeof subscribeToTeamBugs);
console.log('deleteBug:', typeof deleteBug);
