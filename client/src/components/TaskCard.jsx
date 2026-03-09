import React from 'react';
import { motion } from 'framer-motion';

/**
 * TaskCard Component
 * Individual task display component
 * Used in both leader and member dashboards
 * Props: task, onEdit, onDelete, onStatusChange
 */
export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{task?.title || 'Task Title'}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          task?.status === 'completed' ? 'bg-green-100 text-green-800' :
          task?.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {task?.status || 'pending'}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">{task?.description || 'Task description'}</p>

      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
        <span>Due: {task?.dueDate || 'N/A'}</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{task?.priority || 'normal'}</span>
      </div>

      {/* Actions will be implemented */}
    </motion.div>
  );
}
