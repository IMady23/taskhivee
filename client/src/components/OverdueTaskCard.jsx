import React from 'react';
import AccountabilityBadge from './AccountabilityBadge';

const OverdueTaskCard = ({ task, onClick }) => {
  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysOverdue = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = now - deadlineDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysOverdue = getDaysOverdue(task.deadline);

  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {task.title}
        </h3>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Deadline: {formatDeadline(task.deadline)}
        </div>
        <AccountabilityBadge />
      </div>

      {task.priority && (
        <div className="mt-2">
          <span className={`text-xs px-2 py-1 rounded ${
            task.priority === 'High' 
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              : task.priority === 'Medium'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {task.priority} Priority
          </span>
        </div>
      )}
    </div>
  );
};

export default OverdueTaskCard;
