/**
 * Workload Heat Bar Component
 * Displays a colored bar indicator for member workload
 */
const WorkloadHeatBar = ({ memberName, taskCount, heatLevel }) => {
  const getHeatColor = () => {
    switch (heatLevel) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getHeatEmoji = () => {
    switch (heatLevel) {
      case "green":
        return "🟢";
      case "yellow":
        return "🟡";
      case "red":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getHeatText = () => {
    switch (heatLevel) {
      case "green":
        return "Light workload";
      case "yellow":
        return "Moderate workload";
      case "red":
        return "Heavy workload";
      default:
        return "No tasks";
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Heat indicator emoji */}
      <div className="text-2xl">{getHeatEmoji()}</div>

      {/* Member info and bar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {memberName}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {taskCount} {taskCount === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Heat bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`${getHeatColor()} h-2 rounded-full transition-all duration-300`}
            style={{
              width: `${Math.min((taskCount / 10) * 100, 100)}%`,
            }}
          ></div>
        </div>

        {/* Heat level text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {getHeatText()}
        </div>
      </div>
    </div>
  );
};

export default WorkloadHeatBar;
