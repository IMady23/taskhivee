import mongoose from 'mongoose';

/**
 * Message Model
 * Stores chat messages between users
 * Fields:
 *   - senderId: User sending the message
 *   - recipientId: User receiving the message
 *   - text: Message content
 *   - isRead: Whether the message has been read
 *   - attachments: Optional file attachments
 *   - createdAt: Message timestamp
 */
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  attachments: [
    {
      filename: String,
      url: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for efficient querying
  },
});

export default mongoose.model('Message', messageSchema);
