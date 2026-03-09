/**
 * Health Score Breakdown Component
 * Detailed view showing individual metrics
 */
const HealthScoreBreakdown = ({ healthData }) => {
  if (!healthData) return null;

  const metrics = [
    {
      label: "On-Time Completion",
      value: healthData.onTimeCompletionRate,
      icon: "⏰",
      description: "Tasks completed by deadline",
    },
    {
      label: "Team Stability",
      value: healthData.reassignmentRate,
      icon: "🔄",
      description: "Low task reassignment rate",
    },
    {
      label: "Bug Resolution",
      value: healthData.bugResolutionRate,
      icon: "🐛",
      description: "Bugs resolved vs created",
    },
  ];

  const getBarColor = (value) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Health Score Breakdown
      </h3>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{metric.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {metric.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.description}
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(metric.value)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${getBarColor(metric.value)} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${metric.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend indicator */}
      {healthData.trend && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trend:</span>
            {healthData.trend === "improving" && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                📈 Improving
              </span>
            )}
            {healthData.trend === "stable" && (
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                ➡️ Stable
              </span>
            )}
            {healthData.trend === "declining" && (
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                📉 Declining
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthScoreBreakdown;
