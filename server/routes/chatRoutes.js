/**
 * Chat Routes
 * Endpoints:
 *   GET /api/chat/messages/:recipientId - Get messages with user
 *   POST /api/chat/send - Send message (also via Socket.io)
 *   PATCH /api/chat/read - Mark messages as read
 *   GET /api/chat/unread-count - Get unread message count
 *   DELETE /api/chat/messages/:messageId - Delete message
 */
import express from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteMessage,
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Get messages with specific user
router.get('/messages/:recipientId', getMessages);

// Send message
router.post('/send', sendMessage);

// Mark messages as read
router.patch('/read', markAsRead);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Delete message
router.delete('/messages/:messageId', deleteMessage);

export default router;
