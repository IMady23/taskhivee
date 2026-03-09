/**
 * Summary Generator Button Component
 * Button to trigger AI weekly summary generation
 */
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SummaryGeneratorButton = ({ teamId, onSummaryGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const handleGenerate = async () => {
    if (!currentUser) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/teams/${teamId}/generate-summary`, {});

      if (response.data.hasActivity === false) {
        setError("No activity in the past week to summarize");
        return;
      }

      if (onSummaryGenerated) {
        onSummaryGenerated(response.data);
      }
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err.response?.data?.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Generate Weekly Summary</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
};

export default SummaryGeneratorButton;
