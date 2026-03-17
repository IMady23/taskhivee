/**
 * Email Routes
 * Routes for email notifications
 */

import express from 'express';
import {
    sendTaskAssignment,
    sendTeamInvitation,
    sendDeadlineReminder,
    sendLeadershipTransition,
    sendBugAssignment,
    testEmail
} from '../controllers/emailController.js';

const router = express.Router();

// Send task assignment email
router.post('/task-assignment', sendTaskAssignment);

// Send team invitation email
router.post('/team-invitation', sendTeamInvitation);

// Send deadline reminder email
router.post('/deadline-reminder', sendDeadlineReminder);

// Send leadership transition email
router.post('/leadership-transition', sendLeadershipTransition);

// Send bug assignment email
router.post('/bug-assignment', sendBugAssignment);

// Test email connection
router.get('/test', testEmail);

export default router;