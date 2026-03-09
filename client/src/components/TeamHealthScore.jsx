/**
 * Team Health Score Container Component
 * Fetches and displays team health score with breakdown
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import HealthScoreCircle from "./HealthScoreCircle";
import HealthScoreBreakdown from "./HealthScoreBreakdown";

const TeamHealthScore = ({ teamId }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (teamId && currentUser) {
      fetchHealthScore();
    }
  }, [teamId, currentUser]);

  const fetchHealthScore = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      console.log('[TeamHealthScore] Fetching health score for team:', teamId);
      const response = await api.get(`/teams/${teamId}/health-score`);

      console.log('[TeamHealthScore] Full response:', response);
      console.log('[TeamHealthScore] Response.data:', response.data);
      
      setHealthData(response || response?.data || {});
    } catch (err) {
      console.error("Error fetching health score:", err);
      setError("Failed to load health score");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchHealthScore}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        No health data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex items-center justify-center">
        <HealthScoreCircle score={healthData.overallScore} size="large" />
      </div>
      <div>
        <HealthScoreBreakdown healthData={healthData} />
      </div>
    </div>
  );
};

export default TeamHealthScore;
