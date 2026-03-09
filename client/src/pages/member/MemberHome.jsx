import React, { useContext, useState, useEffect } from 'react';
import Card from '../../components/Card';
import TaskItem from '../../components/TaskItem';
import { AuthContext } from '../../context/AuthContext';
import { SkeletonLoader } from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Target, BarChart3, Users } from 'lucide-react';

export default function MemberHome() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    dueToday: 0
  });

  useEffect(() => {
    loadMemberData();
  }, [user]);

  const loadMemberData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { subscribeToMemberTasks } = await import('../../services/taskService');
      const { subscribeToTeamBugs } = await import('../../services/bugService');
      const { checkAndAwardBadges } = await import('../../services/badgeService');
      const { toast } = await import('react-hot-toast');

      // Set up real-time subscriptions
      let currentTasks = [];
      let currentBugs = [];

      const unsubTasks = subscribeToMemberTasks(user.teamId, user.uid, (updatedTasks) => {
        currentTasks = updatedTasks;
        setTasks(updatedTasks);
        const mockSummary = {
          assigned: updatedTasks.length,
          inProgress: updatedTasks.filter(t => t.status === 'In Progress').length,
          completed: updatedTasks.filter(t => t.status === 'Done').length,
          dueToday: updatedTasks.filter(t => t.deadline === 'Today').length,
        };
        setSummary(mockSummary);

        // Trigger badge check when tasks change (Now handled by Notification System in badgeService)
        checkAndAwardBadges(user.uid, updatedTasks, currentBugs);
      });

      // We also need bugs for some badges
      const unsubBugs = subscribeToTeamBugs(user.teamId, (updatedBugs) => {
        currentBugs = updatedBugs;
        // Trigger badge check when bugs change
        checkAndAwardBadges(user.uid, currentTasks, updatedBugs);
      });

      return () => {
        unsubTasks();
        unsubBugs();
      };

    } catch (err) {
      console.error('Error loading member data:', err);
      setError('Failed to load your tasks. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadMemberData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <SkeletonLoader lines={2} className="max-w-md" />
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
              <SkeletonLoader lines={2} />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <SkeletonLoader lines={1} className="mb-3 max-w-32" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border">
                  <SkeletonLoader lines={3} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <SkeletonLoader lines={1} className="mb-3 max-w-40" />
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <SkeletonLoader lines={4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Assigned Tasks',
      value: summary.assigned,
      icon: <Target className="w-5 h-5 text-blue-600" />,
      color: 'blue'
    },
    {
      title: 'In Progress',
      value: summary.inProgress,
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      color: 'orange'
    },
    {
      title: 'Completed',
      value: summary.completed,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      color: 'green'
    },
    {
      title: 'Due Today',
      value: summary.dueToday,
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      color: 'red'
    },
  ];

  const completionRate = summary.assigned > 0 ? Math.round((summary.completed / summary.assigned) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
          <Link to="/profile">
            Welcome, {user?.name || 'Team Member'}
          </Link>
        </h2>
        <p className="text-sm text-gray-400">Here's your task overview for today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.title} className="bg-[#151921] p-6 rounded-lg shadow-sm border border-[#1e293b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-${card.color}-900/20`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-blue-500" />
            My Tasks
          </h3>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="bg-[#151921] p-8 rounded-lg shadow-sm border border-[#1e293b] text-center">
              <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">No Tasks Assigned</h4>
              <p className="text-gray-400">You don't have any tasks assigned yet. Check back later!</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Progress Tracker
          </h3>
          <div className="bg-[#151921] p-6 rounded-lg shadow-sm border border-[#1e293b]">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Task Completion</span>
                <span className="text-sm font-bold text-white">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Tasks</span>
                <span className="font-medium text-white">{summary.assigned}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Completed</span>
                <span className="font-medium text-green-400">{summary.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">In Progress</span>
                <span className="font-medium text-orange-400">{summary.inProgress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Remaining</span>
                <span className="font-medium text-blue-400">{summary.assigned - summary.completed}</span>
              </div>
            </div>

            {completionRate === 100 && summary.assigned > 0 && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-300">
                    Great job! All tasks completed! 🎉
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#151921] p-6 rounded-lg shadow-sm border border-[#1e293b]">
        <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-[#1e293b] rounded-lg hover:border-blue-500 hover:bg-blue-900/20 transition text-center group">
            <Clock className="w-6 h-6 text-gray-500 group-hover:text-blue-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-blue-300">Start Time Tracking</span>
          </button>
          <button className="p-4 border-2 border-dashed border-[#1e293b] rounded-lg hover:border-red-500 hover:bg-red-900/20 transition text-center group">
            <AlertCircle className="w-6 h-6 text-gray-500 group-hover:text-red-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-red-300">Report Bug</span>
          </button>
          <button className="p-4 border-2 border-dashed border-[#1e293b] rounded-lg hover:border-green-500 hover:bg-green-900/20 transition text-center group">
            <Users className="w-6 h-6 text-gray-500 group-hover:text-green-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-green-300">Team Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}