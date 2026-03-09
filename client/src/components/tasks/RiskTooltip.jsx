/**
 * Risk Tooltip Component
 * Hover tooltip showing time remaining vs estimated time
 */
import { useState } from "react";

const RiskTooltip = ({ task, riskAssessment }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!riskAssessment || riskAssessment.riskLevel === "none") {
    return null;
  }

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "N/A";
    
    if (hours < 0) {
      return `${Math.abs(hours).toFixed(1)} hours overdue`;
    }
    
    if (hours < 1) {
      return `${(hours * 60).toFixed(0)} minutes`;
    }
    
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    }
    
    return `${(hours / 24).toFixed(1)} days`;
  };

  return (
    <div className="relative inline-block">
      <div
        className="cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="font-semibold mb-2">⚠ Risk Assessment</div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Time Remaining:</span>
              <span className="font-medium">
                {formatHours(riskAssessment.timeRemaining)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Time:</span>
              <span className="font-medium">
                {formatHours(riskAssessment.estimatedTime)}
              </span>
            </div>
            
            {riskAssessment.timeRemaining < riskAssessment.estimatedTime && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-yellow-300">
                {riskAssessment.timeRemaining < 0
                  ? "This task is overdue!"
                  : "Not enough time to complete this task by the deadline."}
              </div>
            )}
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

export default RiskTooltip;
