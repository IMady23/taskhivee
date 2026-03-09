import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, User, Flag, MessageCircle } from 'lucide-react';
import { getPriorityColor, formatDate, isOverdue, getInitials } from '../../utils/taskUtils';
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
      transition={{ duration: 0.2 }}
      className={`bg-[#0f1419] rounded-lg p-4 mb-3 border-l-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'shadow-xl scale-105' : ''
      }`}
      style={{
        ...style,
        borderLeftColor: priorityColor
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
            <span className="text-blue-400">📎 {task.attachments.length}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
