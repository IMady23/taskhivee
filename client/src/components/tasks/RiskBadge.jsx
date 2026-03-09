/**
 * Risk Badge Component
 * Warning indicator for at-risk tasks
 */
const RiskBadge = ({ riskLevel = "none" }) => {
  if (riskLevel === "none") {
    return null;
  }

  const getBadgeStyle = () => {
    if (riskLevel === "critical") {
      return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700";
    }
    return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700";
  };

  const getBadgeText = () => {
    if (riskLevel === "critical") {
      return "Overdue";
    }
    return "At Risk";
  };

  return (
    <div
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      <span>⚠</span>
      <span>{getBadgeText()}</span>
    </div>
  );
};

export default RiskBadge;
