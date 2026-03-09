/**
 * Dependency Block Modal Component
 * Modal explaining which tasks must be completed first
 */
const DependencyBlockModal = ({ isOpen, onClose, blockedBy = [], taskTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔒</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Task Blocked
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            <span className="font-medium">{taskTitle}</span> cannot be completed yet because it depends on other tasks.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Complete these tasks first:
            </p>
            <ul className="space-y-2">
              {blockedBy.map((task, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-yellow-900 dark:text-yellow-100"
                >
                  <span className="mr-2 mt-0.5">•</span>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      Current status: {task.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Once all dependency tasks are marked as "Done", you'll be able to complete this task.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default DependencyBlockModal;
