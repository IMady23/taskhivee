import React from 'react';

export default function TaskItem({ task }) {
  const priorityColor = task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  const statusColor = task.status === 'In Progress' ? 'text-blue-600' : task.status === 'Done' ? 'text-green-600' : 'text-gray-700';

  return (
    <div className="bg-white border rounded-md p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="font-semibold text-gray-800">{task.name}</div>
        <div className="text-sm text-gray-500">Due: {task.deadline}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`px-2 py-1 text-xs rounded ${priorityColor}`}>{task.priority}</div>
        <div className={`text-sm font-medium ${statusColor}`}>{task.status}</div>
      </div>
    </div>
  );
}