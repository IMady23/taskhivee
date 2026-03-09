/**
 * Workload Dashboard Component
 * Grid layout showing all team members' heat indicators
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import WorkloadHeatBar from "./WorkloadHeatBar";
import api from "../services/api";

const WorkloadDashboard = ({ teamId }) => {
  const [workloadData, setWorkloadData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (teamId && currentUser) {
      fetchWorkloadData();
    }
  }, [teamId, currentUser]);

  const fetchWorkloadData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('[WorkloadDashboard] Fetching workload for team:', teamId);
      const response = await api.get(`/teams/${teamId}/workload`);

      console.log('[WorkloadDashboard] Full response:', response);
      console.log('[WorkloadDashboard] Response.data:', response.data);
      console.log('[WorkloadDashboard] Response.workload:', response.workload);
      
      setWorkloadData(response?.workload || response?.data?.workload || []);
      setSummary(response?.summary || response?.data?.summary || null);
    } catch (err) {
      console.error("Error fetching workload data:", err);
      setError("Failed to load workload data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchWorkloadData}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Team Workload Distribution
          </h2>
          <button
            onClick={fetchWorkloadData}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Refresh
          </button>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.totalMembers}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Team Members
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.greenCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Light Load 🟢
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.yellowCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Moderate Load 🟡
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.redCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Heavy Load 🔴
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workload bars */}
      <div className="p-6">
        {workloadData.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No team members found
          </div>
        ) : (
          <div className="space-y-3">
            {workloadData.map((member) => (
              <WorkloadHeatBar
                key={member.memberId}
                memberName={member.memberName}
                taskCount={member.taskCount}
                heatLevel={member.heatLevel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkloadDashboard;
