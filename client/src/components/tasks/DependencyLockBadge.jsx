/**
 * Dependency Lock Badge Component
 * Shows lock icon with tooltip for tasks with incomplete dependencies
 */
import { useState } from "react";

const DependencyLockBadge = ({ blockedBy = [] }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!blockedBy || blockedBy.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span>🔒</span>
        <span>Blocked</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="font-semibold mb-2">Blocked by:</div>
          <ul className="space-y-1">
            {blockedBy.map((task, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-gray-400 text-xs">Status: {task.status}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
            Complete these tasks first to unlock this task
          </div>

          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DependencyLockBadge;
