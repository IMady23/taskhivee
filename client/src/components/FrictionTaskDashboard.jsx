import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FrictionBadge from './FrictionBadge';
import ReassignmentHistoryModal from './ReassignmentHistoryModal';

const FrictionTaskDashboard = ({ teamId }) => {
  const [frictionTasks, setFrictionTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchFrictionTasks();
    }
  }, [teamId]);

  const fetchFrictionTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/teams/${teamId}/friction-tasks`);
      setFrictionTasks(response?.data?.tasks || response?.tasks || []);
    } catch (err) {
      console.error('Error fetching friction tasks:', err);
      setError('Failed to load friction tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (taskId) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          High Friction Tasks
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          High Friction Tasks
        </h3>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            High Friction Tasks
          </h3>
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
            {frictionTasks.length} {frictionTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {frictionTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600 dark:text-gray-400">
              No high friction tasks! Team collaboration is smooth.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {frictionTasks.map((task) => (
              <div
                key={task.id}
                className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Assigned to: {task.assignedToName || 'Unassigned'}</span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {task.reassignmentCount} reassignments
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewHistory(task.id)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View History
                  </button>
                </div>

                <div className="mt-3">
                  <FrictionBadge reassignmentCount={task.reassignmentCount} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReassignmentHistoryModal
        taskId={selectedTaskId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FrictionTaskDashboard;
