import express from 'express';
import { createRoom, joinRoom } from '../controllers/voiceController.js';

const router = express.Router();

// Route to create or get a team voice room
router.post('/create-room', createRoom);

// Route to get a meeting token to join a room
router.post('/join-room', joinRoom);

export default router;
