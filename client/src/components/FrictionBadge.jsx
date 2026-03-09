import React from 'react';

const FrictionBadge = ({ reassignmentCount }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
      <span className="text-orange-600 dark:text-orange-400 text-sm">⚠</span>
      <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
        High Friction Task
      </span>
      {reassignmentCount && (
        <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">
          ({reassignmentCount} reassignments)
        </span>
      )}
    </div>
  );
};

export default FrictionBadge;
