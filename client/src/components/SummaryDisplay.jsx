/**
 * Summary Display Component
 * Formatted display with copy-to-clipboard functionality
 */
import { useState } from "react";

const SummaryDisplay = ({ summary, metrics, generatedAt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date) => {
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Weekly Summary
        </h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Summary content */}
      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {summary}
        </div>
      </div>

      {/* Metrics badges */}
      {metrics && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
              ✅ {metrics.tasksCompleted} completed
            </span>
            {metrics.tasksLate > 0 && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                ⏰ {metrics.tasksLate} late
              </span>
            )}
            {metrics.reassignments > 0 && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                🔄 {metrics.reassignments} reassignments
              </span>
            )}
            {metrics.bugsResolved > 0 && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                🐛 {metrics.bugsResolved} bugs fixed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Generated timestamp */}
      {generatedAt && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Generated on {formatDate(generatedAt)}
        </div>
      )}
    </div>
  );
};

export default SummaryDisplay;
