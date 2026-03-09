import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Chat Component
 * Real-time messaging interface
 * Integrated with Socket.io for live updates
 * Props: conversationId, recipientId
 */
export default function Chat({ conversationId, recipientId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch messages and setup Socket.io listeners
    setLoading(false);
  }, [conversationId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // TODO: Send message via Socket.io
    setNewMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-white rounded-lg shadow-md"
    >
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.senderId === 'currentUser' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}>
                <p>{msg.text}</p>
                <span className="text-xs opacity-75">{msg.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </motion.div>
  );
}
