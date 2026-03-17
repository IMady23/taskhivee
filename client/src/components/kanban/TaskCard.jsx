import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { TasksContext } from '../../context/TasksContext';
import toast from 'react-hot-toast';
import { Calendar, User, Flag, MessageCircle, Paperclip } from 'lucide-react';
import { getPriorityColor, formatDate, isOverdue, getInitials } from '../../utils/taskUtils';
import { downloadAttachment, isLocalAttachment } from '../../utils/fileUtils';
import { getCommentCount } from '../../services/commentService';

/**
 * TaskCard Component
 * Draggable task card for Kanban board
 */
export default function TaskCard({ task, index }) {
  const [commentCount, setCommentCount] = useState(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  useEffect(() => {
    if (task.id) {
      getCommentCount(task.id).then(count => setCommentCount(count));
    }
  }, [task.id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const priorityColor = getPriorityColor(task.priority);
  const overdue = isOverdue(task);

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={!isDragging ? { scale: 1.02, y: -2 } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-[var(--card)] rounded-xl p-4 mb-3 border border-white/5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all ${
        isDragging ? 'shadow-2xl scale-105 rotate-2 border-blue-500/50' : ''
      }`}
      style={{
        ...style,
        borderLeft: `4px solid ${priorityColor}`
      }}
      data-task-id={task.id}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            backgroundColor: `${priorityColor}20`,
            color: priorityColor
          }}
        >
          <Flag size={12} className="inline mr-1" />
          {task.priority || 'Medium'}
        </span>
        
        {/* Assignee Avatar */}
        {task.assignedToName && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: priorityColor }}
            title={task.assignedToName}
          >
            {getInitials(task.assignedToName)}
          </div>
        )}
      </div>

      {/* Task Title */}
      <h3 className="text-white font-semibold mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-semibold' : ''}`}>
            <Calendar size={14} />
            <span>{formatDate(task.dueDate)}</span>
            {overdue && <span className="text-red-500">⚠️</span>}
          </div>
        )}

        {/* Task Info */}
        <div className="flex items-center gap-2">
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-blue-400">
              <MessageCircle size={14} />
              <span>{commentCount}</span>
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex gap-2">
              {task.attachments.slice(0, 2).map((file, idx) => (
                <a
                  key={idx}
                  href={isLocalAttachment(file.url) ? "#" : file.url}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening task details modal
                    downloadAttachment(e, file.url, file.name);
                  }}
                  target={isLocalAttachment(file.url) ? undefined : "_blank"}
                  rel={isLocalAttachment(file.url) ? undefined : "noreferrer"}
                  className="px-2 py-1 bg-gray-800 rounded flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition truncate max-w-[120px]"
                >
                  <Paperclip className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </a>
              ))}
              {task.attachments.length > 2 && (
                <span className="text-blue-400">📎 {task.attachments.length}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
