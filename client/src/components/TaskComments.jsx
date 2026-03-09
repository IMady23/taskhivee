import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { addTaskComment, subscribeToTaskComments, deleteTaskComment, updateTaskComment } from '../services/commentService';
import { notifyTaskComment } from '../services/notificationService';
import { MessageCircle, Send, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskComments({ taskId, taskTitle, taskAssigneeId, teamId }) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!taskId) return;

    const unsubscribe = subscribeToTaskComments(taskId, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      await addTaskComment({
        taskId,
        userId: user.uid,
        userName: user.name || user.email,
        userRole: user.role,
        comment: newComment.trim()
      });

      // Notify task assignee if they're not the commenter
      if (taskAssigneeId && taskAssigneeId !== user.uid) {
        await notifyTaskComment(
          taskId,
          taskTitle,
          user.uid,
          user.name || user.email,
          taskAssigneeId,
          teamId
        );
      }

      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteTaskComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await updateTaskComment(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-[#151921]/40 backdrop-blur-md rounded-2xl border border-[#1e293b] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
        <MessageCircle size={20} className="text-blue-400" />
        <h3 className="font-bold text-white text-lg">Comments</h3>
        <span className="ml-auto text-xs text-gray-500 font-bold">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500 text-sm"
            >
              No comments yet. Be the first to share your thoughts!
            </motion.div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a1f26] rounded-xl p-4 border border-[#1e293b] hover:border-gray-600 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {comment.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-200">{comment.userName}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {comment.userRole} • {formatTime(comment.createdAt)}
                        {comment.edited && <span className="ml-2 italic">(edited)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Actions (only for comment author) */}
                  {comment.userId === user.uid && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId !== comment.id && (
                        <>
                          <button
                            onClick={() => startEdit(comment)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Text */}
                {editingId === comment.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#0B0F14] border border-[#1e293b] text-white text-sm rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(comment.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-xs font-bold"
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-xs font-bold"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm leading-relaxed mt-3 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="border-t border-[#1e293b] pt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this task..."
              className="w-full bg-[#0B0F14] border border-[#1e293b] text-white text-sm rounded-xl p-4 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-600"
              rows="3"
              disabled={loading}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-lg shadow-blue-900/20 transition-all"
              >
                <Send size={16} />
                {loading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
