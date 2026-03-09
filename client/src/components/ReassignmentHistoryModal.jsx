import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ReassignmentHistoryModal = ({ taskId, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchHistory();
    }
  }, [isOpen, taskId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/tasks/firestore/${taskId}/reassignment-history`);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Error fetching reassignment history:', err);
      setError('Failed to load reassignment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reassignment History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading history...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No reassignments yet</p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {history.map((entry, index) => (
                  <div key={index} className="relative pb-8">
                    {/* Timeline line */}
                    {index < history.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                    )}

                    {/* Timeline dot */}
                    <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white dark:border-gray-800"></div>

                    {/* Content */}
                    <div className="ml-10">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Reassigned by {entry.reassignedByName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(entry.timestamp)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">From:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {entry.fromMemberName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">To:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {entry.toMemberName}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Reason: {entry.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignmentHistoryModal;
