// Test file to verify exports
import * as bugService from './bugService.js';

console.log('Bug Service Exports:', Object.keys(bugService));
console.log('Has createBug:', typeof bugService.createBug);
console.log('Has deleteBug:', typeof bugService.deleteBug);
console.log('Has getTeamBugs:', typeof bugService.getTeamBugs);
console.log('Has updateBugStatus:', typeof bugService.updateBugStatus);
console.log('Has subscribeToTeamBugs:', typeof bugService.subscribeToTeamBugs);
