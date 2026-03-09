import React, { useContext, useState, useEffect } from 'react';
import Card from '../../components/Card';
import TasksContext from '../../context/TasksContext';
import BugsContext from '../../context/BugsContext';
import { AuthContext } from '../../context/AuthContext';
import { getTaskStats } from '../../services/taskService';
import { getTeamMembers, getTeamByDocId } from '../../services/teamService';
import WorkloadDashboard from '../../components/WorkloadDashboard';
import FrictionTaskDashboard from '../../components/FrictionTaskDashboard';
import SummaryGeneratorButton from '../../components/SummaryGeneratorButton';
import SummaryDisplay from '../../components/SummaryDisplay';
import SummaryHistory from '../../components/SummaryHistory';

export default function LeaderHome() {
  const { user } = useContext(AuthContext);
  const { tasks } = useContext(TasksContext);
  const { bugs } = useContext(BugsContext);
  const [taskStats, setTaskStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [teamMembers, setTeamMembers] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestSummary, setLatestSummary] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.teamId) {
      setLoading(false);
      return;
    }

    try {
      // Load team info
      const teamData = await getTeamByDocId(user.teamId);
      setTeam(teamData);

      // Load team members
      const membersData = await getTeamMembers(user.teamId);
      setTeamMembers(membersData);

      // Load task statistics
      const stats = await getTaskStats(user.teamId);
      setTaskStats(stats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBugs = bugs.filter((b) => b.status === 'Open').length;
  const resolvedBugs = bugs.filter((b) => b.status === 'Resolved').length;

  const summary = [
    { title: 'Total Tasks', value: taskStats.total },
    { title: 'To Do', value: taskStats.todo },
    { title: 'In Progress', value: taskStats.inProgress },
    { title: 'Completed', value: taskStats.completed },
    { title: 'Open Bugs', value: openBugs },
    { title: 'Team Members', value: teamMembers.length },
  ];

  const activities = [
    `Team "${team?.name || 'Your Team'}" has ${teamMembers.length} members`,
    `${taskStats.completed} tasks completed this week`,
    `${taskStats.overdue} tasks are overdue and need attention`,
    `${taskStats.inProgress} tasks currently in progress`,
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Welcome back, {user?.name || 'Leader'}
        </h2>
        <p className="text-sm text-gray-400">
          {team ? `Managing team: ${team.name}` : 'Here\'s a snapshot of your project status'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {summary.map((s) => (
          <Card key={s.title} title={s.title} value={s.value} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-[#151921] rounded-lg p-6 shadow-sm border border-[#1e293b]">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/leader/tasks"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                Manage Tasks
              </a>
              <a
                href="/leader/team"
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
              >
                Manage Team
              </a>
              {!team && (
                <a
                  href="/leader/team"
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center"
                >
                  Create Team
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Task Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>{taskStats.completed}/{taskStats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: taskStats.total > 0 ? `${(taskStats.completed / taskStats.total) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Team Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Members</span>
                <span>{teamMembers.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Team Capacity</span>
                <span>{team?.maxSize || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#151921] rounded-lg p-6 shadow-sm border border-[#1e293b] mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Team Overview</h3>
        <ul className="space-y-2 text-gray-400">
          {activities.map((activity, i) => (
            <li key={i} className="text-sm flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              {activity}
            </li>
          ))}
        </ul>
      </div>

      {/* NEW FEATURES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Workload Heat Indicator */}
        {user?.teamId && (
          <WorkloadDashboard teamId={user.teamId} />
        )}

        {/* Friction Tasks */}
        {user?.teamId && (
          <FrictionTaskDashboard teamId={user.teamId} />
        )}
      </div>

      {/* AI Weekly Summary */}
      {user?.teamId && (
        <div className="bg-[#151921] rounded-lg p-6 shadow-sm border border-[#1e293b] mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">AI Weekly Summary</h3>
            <SummaryGeneratorButton 
              teamId={user.teamId} 
              onSummaryGenerated={setLatestSummary}
            />
          </div>
          
          {latestSummary && (
            <div className="mb-4">
              <SummaryDisplay summary={latestSummary} />
            </div>
          )}

          <SummaryHistory teamId={user.teamId} />
        </div>
      )}
    </div>
  );
}