/**
 * Health Score Trend Component
 * Line chart showing score over time
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const HealthScoreTrend = ({ teamId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (teamId) {
      fetchHistory();
    }
  }, [teamId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await api.get(
        `/teams/${teamId}/health-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(response.data.history || []);
    } catch (error) {
      console.error("Error fetching health history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Health Score Trend
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No historical data available yet
        </div>
      </div>
    );
  }

  // Simple visualization using bars
  const maxScore = Math.max(...history.map((h) => h.score));
  const minScore = Math.min(...history.map((h) => h.score));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Health Score Trend
      </h3>

      <div className="flex items-end space-x-1 h-48">
        {history.slice(-20).map((item, index) => {
          const height = ((item.score - minScore) / (maxScore - minScore || 1)) * 100;
          const color =
            item.score >= 80
              ? "bg-green-500"
              : item.score >= 60
              ? "bg-yellow-500"
              : "bg-red-500";

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div
                className={`w-full ${color} rounded-t transition-all duration-300 hover:opacity-80`}
                style={{ height: `${height}%` }}
              ></div>

              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div>{Math.round(item.score)}%</div>
                <div className="text-gray-400">
                  {new Date(item.calculatedAt.seconds * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          {history.length > 20 ? "Last 20 records" : `${history.length} records`}
        </span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded mr-1"></span>
            Good (80%+)
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded mr-1"></span>
            Fair (60-79%)
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded mr-1"></span>
            Poor (&lt;60%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreTrend;
