/**
 * Chat Controller
 * Handles message operations
 * Methods: getMessages, sendMessage, markAsRead
 */

// TODO: getMessages - Retrieve messages between two users
export const getMessages = async (req, res) => {
  try {
    // Get userId and recipientId from params
    // Find all messages between these two users
    // Sort by createdAt (ascending)
    // Return paginated message list
    res.status(200).json({
      message: 'Messages retrieved',
      messages: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

// TODO: sendMessage - Send a new message (via Socket.io)
export const sendMessage = async (req, res) => {
  try {
    // Get senderId (from auth), recipientId, and text
    // Create message document
    // Emit Socket.io event to recipient
    // Return created message
    res.status(201).json({
      message: 'Message sent',
      messageData: {
        id: 'MESSAGE_ID',
        senderId: 'USER_ID',
        recipientId: 'USER_ID',
        text: 'MESSAGE_TEXT',
        createdAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// TODO: markAsRead - Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    // Get messageIds array
    // Update isRead to true for all messages
    // Return updated message count
    res.status(200).json({
      message: 'Messages marked as read',
      updatedCount: 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark messages as read', error: error.message });
  }
};

// TODO: getUnreadCount - Get count of unread messages for user
export const getUnreadCount = async (req, res) => {
  try {
    // Get userId from auth
    // Count all messages where recipientId === userId and isRead === false
    // Return unread count
    res.status(200).json({
      message: 'Unread count retrieved',
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch unread count', error: error.message });
  }
};

// TODO: deleteMessage - Delete a message (soft delete recommended)
export const deleteMessage = async (req, res) => {
  try {
    // Get messageId
    // Delete or mark as deleted
    // Return success message
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};
