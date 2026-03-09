/**
 * Health Score Circle Component
 * Color-coded circle displaying team health percentage
 */
const HealthScoreCircle = ({ score, size = "large" }) => {
  const getColor = () => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = () => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  const getBorderColor = () => {
    if (score >= 80) return "border-green-500";
    if (score >= 60) return "border-yellow-500";
    return "border-red-500";
  };

  const sizeClasses = {
    small: "w-16 h-16 text-lg",
    medium: "w-24 h-24 text-2xl",
    large: "w-32 h-32 text-4xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getBgColor()} ${getBorderColor()} border-4 rounded-full flex flex-col items-center justify-center`}
    >
      <div className={`font-bold ${getColor()}`}>{Math.round(score)}%</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Health</div>
    </div>
  );
};

export default HealthScoreCircle;
