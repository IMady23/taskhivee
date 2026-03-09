import React from 'react';

const AccountabilityBadge = ({ message = 'This task needs attention.' }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <span className="text-amber-600 dark:text-amber-400 text-sm">⚠</span>
      <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
        {message}
      </span>
    </div>
  );
};

export default AccountabilityBadge;
