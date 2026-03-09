/**
 * Summary History Component
 * List of past summaries
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SummaryHistory = ({ teamId }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (teamId) {
      fetchSummaries();
    }
  }, [teamId]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await api.get(
        `/teams/${teamId}/summaries`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSummaries(response.data.summaries || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No summaries generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Summary History
        </h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            onClick={() => setSelectedSummary(summary)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Week of {formatDate(summary.weekStartDate)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summary.metrics.tasksCompleted} tasks completed •{" "}
                  {summary.metrics.bugsResolved} bugs resolved
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing full summary */}
      {selectedSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setSelectedSummary(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Week of {formatDate(selectedSummary.weekStartDate)}
                </h3>
                <button
                  onClick={() => setSelectedSummary(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {selectedSummary.summary}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryHistory;
