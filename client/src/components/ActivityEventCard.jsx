/**
 * Activity Event Card Component
 * Individual event display with icon, time, and description
 */
const ActivityEventCard = ({ event }) => {
  const formatTime = (timestamp) => {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (timestamp) => {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl">
        {event.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatTime(event.timestamp)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(event.timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {event.description}
        </p>
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {JSON.stringify(event.metadata)}
          </div>
        )}
      </div>

      {/* Vertical line connector */}
      <div className="absolute left-9 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
    </div>
  );
};

export default ActivityEventCard;
