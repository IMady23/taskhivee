import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Flag,
  User,
  Target,
  PlayCircle,
  CheckSquare,
  Square,
  Loader2,
  Bug,
  Plus,
  AlertTriangle,
  Users,
  Quote,
  Paperclip,
  Award,
  Coffee
} from 'lucide-react';
import { calculateMemberStats } from '../services/analyticsService';
import { AuthContext } from '../context/AuthContext';
import TasksContext from '../context/TasksContext';
import { updateTask as serviceUpdateTask, getTeamTasks, subscribeToTeamTasks } from '../services/taskService'; // Specific imports
import { RefreshCcw, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

import { createBug, getTeamBugs } from '../services/bugService';
import { getTeamByDocId, getTeamMembers } from '../services/teamService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import BugReportForm from '../components/BugReportForm';
import BugList from '../components/BugList';
import { downloadAttachment, isLocalAttachment } from '../utils/fileUtils';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import KanbanBoard from '../components/kanban/KanbanBoard';
import CalendarView from '../components/calendar/CalendarView';
import { useEventReminders } from '../hooks/useEventReminders.jsx';
import { Trash2 } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import CommandPalette from '../components/CommandPalette';
import Celebration from '../components/ui/Celebration';

const MOTIVATIONAL_QUOTES = [
  "Quality is not an act, it is a habit.",
  "Your only limit is your mind.",
  "Small steps in the right direction can turn out to be the biggest step of your life.",
  "The secret of getting ahead is getting started.",
  "It always seems impossible until it's done.",
  "Code matches the design? That's a win.",
  "Focus on being productive instead of busy.",
  "Simplicity is the soul of efficiency.",
  "Make it work, make it right, make it fast."
];

export default function MemberDashboard() {
  const { user, isAuthenticated, isInitializing, logout } = useContext(AuthContext);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { tasks: contextTasks, updateTask: contextUpdateTask } = useContext(TasksContext); // Use context
  const navigate = useNavigate();

  // Enable event reminders
  useEventReminders();

  // tasks state is now derived from context, but for compatibility with existing code that writes to it (if any), 
  // we might want to just alias it. However, the component updates tasks locally in handleStatusUpdate.
  // We should rely on Context for updates. 
  // Let's use contextTasks directly as 'tasks'.

  const tasks = contextTasks || []; // Derived from context

  const [bugs, setBugs] = useState([]);
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('tasks'); // 'kanban', 'calendar', 'tasks' or 'bugs'
  const [quote, setQuote] = useState('');

  // Reassignment state
  const { requestReassignment } = useContext(TasksContext);
  const [showReassignConfirm, setShowReassignConfirm] = useState(null); // taskId
  const [reassignLoading, setReassignLoading] = useState(false);
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");

  const handleRequestReassignment = async (taskId) => {
    setReassignLoading(true);
    await requestReassignment(taskId);
    setReassignLoading(false);
    setShowReassignConfirm(null);
    toast.success("Reassignment requested");
  };

  // Bug reporting state
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'Medium'
  });
  const [submittingBug, setSubmittingBug] = useState(false);
  const [refreshBugList, setRefreshBugList] = useState(0);


  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  // Redirect if not authenticated or not a member
  useEffect(() => {
    if (!isInitializing && (!isAuthenticated || !user)) {
      navigate('/auth?mode=login');
      return;
    }

    if (!isInitializing && user && user.role !== 'member') {
      navigate('/leader/dashboard');
      return;
    }
  }, [isAuthenticated, user, isInitializing, navigate]);

  // Feature: Auto-Logout if Team is Deleted
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Check if teamId is gone (meaning team deleted or user removed)
        // But only if we are fully initialized and authenticated
        if (isAuthenticated && !isInitializing) {
          if (!userData.teamId && !userData.organization) {
            toast.error("Your team has been deleted. You are being logged out.");
            // Logout using function from context
            logout();
          }
        }
      }
    });
    return () => unsub();
  }, [user?.uid, isAuthenticated, isInitializing, logout]);

  // Load member data
  useEffect(() => {
    const loadMemberData = async () => {
      if (!user.teamId) {
        setLoading(false);
        return;
      }

      try {
        const teamDataPromise = getTeamByDocId(user.teamId).catch(err => {
          console.error("Failed to load team:", err);
          return null;
        });

        const memberBugsPromise = getTeamBugs(user.teamId).catch(err => {
          console.error("Failed to load member bugs:", err);
          return [];
        });

        const allMembersPromise = getTeamMembers(user.teamId).catch(err => {
          console.error("Failed to load team members:", err);
          return [];
        });

        const [teamData, memberBugs, allMembers] = await Promise.all([
          teamDataPromise,
          memberBugsPromise,
          allMembersPromise
        ]);

        if (teamData) setTeam(teamData);
        setBugs(memberBugs);
        setTeamMembers(allMembers);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Partial data loading failure. Please check console.');
      } finally {
        setLoading(false);
      }
    };

    if (user && !isInitializing) {
      loadMemberData();
    }
  }, [user, isInitializing]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!user?.teamId) return;

    // Subscribe to ALL team tasks (for "My Team" view)
    const unsubscribeTeamTasks = subscribeToTeamTasks(user.teamId, (updatedTasks) => {
      setTeamTasks(updatedTasks);
    });

    return () => {
      unsubscribeTeamTasks();
    };
  }, [user?.teamId]);

  const handleStatusUpdate = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    setError('');
    try {
      const isMember = user?.role === 'member';
      const targetStatus = isMember && newStatus === 'Done' ? 'Review' : newStatus;

      // Use Context Action (has additional guards for members)
      const updates = { status: targetStatus };
      if (targetStatus === 'Review') {
        updates.submittedForReviewAt = new Date().toISOString();
      }
      await contextUpdateTask(taskId, updates);

      // Manually update teamTasks state for immediate reflection in "My Team" list
      // (Since teamTasks is a separate subscription, it might take a moment to reflect via socket)
      setTeamTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

      setTeamTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

      setSuccess(
        targetStatus === 'Review'
          ? 'Task submitted for review.'
          : `Task updated to "${targetStatus}"`
      );
      
      // Trigger Celebration if all tasks are Done/Review
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t);
      const pendingCount = updatedTasks.filter(t => t.status !== 'Done' && t.status !== 'Review').length;
      if (pendingCount === 0 && updatedTasks.length > 0) {
          setCelebrationMessage("All Tasks Completed!");
          setShowCelebration(true);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update status.');
    } finally {
      setUpdatingTask(null);
    }
  };

  // Bug Handlers (Simplified, now handled by BugsContext)
  const handleBugSubmit = async () => {
    if (!bugForm.title.trim() || !bugForm.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmittingBug(true);
    try {
      // Logic now handled in the BugReportForm and BugsContext
      setSuccess('Bug reported successfully');
      setBugForm({ title: '', description: '', severity: 'Medium' });
      setShowBugForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingBug(false);
    }
  };

  // Helpers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };



  const getStats = () => {
    const { myOverview } = calculateMemberStats(user.uid, tasks, bugs);
    return {
      totalMembers: teamMembers.length,
      myTasksTotal: myOverview.totalTasks,
      myPending: myOverview.totalTasks - myOverview.completedTasks,
      myCompleted: myOverview.completedTasks,
      onTimeRate: myOverview.onTimeRate,
      avgCompletionTime: myOverview.avgCompletionTime
    };
  };

  const stats = getStats();
  const leader = teamMembers.find(m => m.role === 'leader');

  if (isInitializing || loading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
        <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2 pt-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8 space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] w-full" />
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <LoadingSpinner fullScreen message="Redirecting..." />;

  // Render Helpers
  const getStatusBadge = (status) => {
    const styles = {
      'To Do': 'bg-gray-100/10 text-gray-400 border-gray-800',
      'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Done': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Reassignment Requested': 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['To Do']}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-300">
      <Sidebar role="member" />
      <div className="flex-1 flex flex-col relative z-10 ml-64">
        <Navbar />
        <main className="flex-1 overflow-auto p-8">
          <Celebration active={showCelebration} message={celebrationMessage} onClose={() => setShowCelebration(false)} />
          <div className="max-w-7xl mx-auto space-y-8">

            {/* 1. Welcome Section */}
            <div className="bg-[var(--bg-secondary)] rounded-3xl p-8 shadow-sm border border-[var(--border-color)] relative overflow-hidden transition-colors duration-300">
              <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tighter text-[var(--text-primary)] mb-2 uppercase italic">
                  {getGreeting()}, {user.name?.split(' ')[0] || 'Member'}
                </h1>
                <p className="text-[var(--text-secondary)] mb-6 flex items-center gap-2 font-medium">
                  Workspace: <span className="font-bold text-[var(--text-primary)] uppercase tracking-widest text-xs">{team?.name || '...'}</span>
                  {leader && <span className="text-[var(--text-secondary)] font-bold">• LEAD: {leader.name.toUpperCase()}</span>}
                </p>

                <div className="inline-flex items-center gap-3 bg-blue-500/5 text-blue-400 px-5 py-3 rounded-2xl text-xs font-bold italic border border-blue-500/10">
                  <Quote size={14} className="opacity-50" />
                  {quote}
                </div>
              </div>

              {/* Dynamic Glow - Progressive Color Transition (P9) */}
              <motion.div
                animate={{
                  background: activeTab === 'tasks' ? 'radial-gradient(circle at top right, rgba(37,99,235,0.1), transparent)' :
                    activeTab === 'bugs' ? 'radial-gradient(circle at top right, rgba(220,38,38,0.1), transparent)' :
                      'radial-gradient(circle at top right, rgba(16,185,129,0.1), transparent)'
                }}
                className="absolute inset-0 pointer-events-none -z-10"
              />

              {/* Decorative background element - Refined */}
              <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-current opacity-[0.03] transition-colors duration-700"
                style={{ color: activeTab === 'tasks' ? '#3b82f6' : activeTab === 'bugs' ? '#ef4444' : '#10b981' }}
              />
            </div>

            {/* Success/Error Alerts */}
            {(success || error) && (
              <div className={`p-5 rounded-2xl border flex items-center gap-3 font-bold text-xs uppercase tracking-widest ${success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                {success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {success || error}
              </div>
            )}

            <CommandPalette isOpen={showCommandPalette} onClose={setShowCommandPalette} />

            {/* 2. Overview Cards - Outcome Driven */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Team Members</span>
                  <Users size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)] italic relative z-10">{stats.totalMembers}</div>
                <div className="h-10 mt-4 opacity-30 group-hover:opacity-60 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                    <LineChart data={[4, 6, 5, 8, 7, 9, stats.totalMembers].map((v, i) => ({ v }))}>
                      <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">On-Time Rate</span>
                  <Award size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black text-green-400 italic relative z-10">{stats.onTimeRate}%</div>
                <div className="h-10 mt-4 opacity-30 group-hover:opacity-60 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                    <LineChart data={[60, 75, 70, 85, 80, 95, stats.onTimeRate].map((v, i) => ({ v }))}>
                      <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Avg Duration</span>
                  <Clock size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)] italic truncate relative z-10">{stats.avgCompletionTime}</div>
                <div className="h-10 mt-4 opacity-30 group-hover:opacity-60 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                    <LineChart data={[10, 15, 12, 18, 14, 20, 16].map((v, i) => ({ v }))}>
                      <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Pending Tasks</span>
                  <Target size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)] italic relative z-10">{stats.myPending}</div>
                <div className="h-10 mt-4 opacity-30 group-hover:opacity-60 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                    <LineChart data={[5, 4, 6, 3, 5, 2, stats.myPending].map((v, i) => ({ v }))}>
                      <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* 3. My Team Section (Read-Only) */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm p-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Users size={20} className="text-[var(--text-secondary)]" />
                    My Team
                  </h3>

                  <div className="space-y-6">
                    {teamMembers.length === 0 && (
                      <p className="text-[var(--text-secondary)] text-sm italic">You are currently the only member.</p>
                    )}

                    {/* Active Members */}
                    {teamMembers.map(member => {
                      const memberTasks = teamTasks.filter(t => t.assignedTo === member.id && t.isActive);
                      return (
                        <div key={member.id} className="group">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold border-2 ${member.role === 'leader' ? 'border-purple-500/50 bg-purple-900/30 text-purple-400' : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                              }`}>
                              {member.photoURL ? (
                                <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{member.name ? member.name.charAt(0).toUpperCase() : '?'}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                                {member.name || member.email}
                                {member.id === user.uid && <span className="text-xs text-[var(--text-secondary)]">(You)</span>}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] capitalize">{member.role}</div>
                            </div>
                          </div>

                          {/* Mini Task List for Member */}
                          <div className="ml-11 space-y-1">
                            {memberTasks.length === 0 ? (
                              <div className="flex items-center gap-2 py-1 opacity-40 group-hover:opacity-60 transition-opacity">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">All Clear</span>
                              </div>
                            ) : (
                              memberTasks.slice(0, 3).map(t => (
                                <div key={t.id} className="flex items-center justify-between text-xs bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border-color)]">
                                  <span className="truncate max-w-[120px] text-[var(--text-secondary)]">{t.title}</span>
                                  {getStatusBadge(t.status)}
                                </div>
                              ))
                            )}
                            {memberTasks.length > 3 && (
                              <div className="text-xs text-[var(--text-secondary)] pl-1">+{memberTasks.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pending Invitations */}
                    {team?.invitedMembers && team.invitedMembers.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-[var(--border-color)]">
                        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Pending Joined</h4>
                        <div className="space-y-3">
                          {team.invitedMembers.map((invite, idx) => (
                            <div key={idx} className="flex items-center gap-3 opacity-60">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-dashed border-[var(--border-color)]">
                                {invite.name ? invite.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-[var(--text-secondary)]">
                                  {invite.name || invite.email}
                                </div>
                                <div className="text-xs text-orange-500 flex items-center gap-1">
                                  <Clock size={10} /> Pending Signup
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 4. My Tasks & Bugs Tabs */}
              <div className="lg:col-span-2">
                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                  <div className="border-b border-[var(--border-color)] flex">
                    <button
                      onClick={() => setActiveTab('kanban')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'kanban' ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50'
                        }`}
                    >
                      Kanban Board
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50'
                        }`}
                    >
                      Calendar & Events
                    </button>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50'
                        }`}
                    >
                      My Tasks
                    </button>
                    <button
                      onClick={() => setActiveTab('bugs')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bugs' ? 'border-purple-500 text-purple-400 bg-purple-900/10' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50'
                        }`}
                    >
                      My Bug Reports
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'kanban' && (
                      <div className="h-[600px]">
                        <KanbanBoard projectId={user.teamId} userRole="member" userId={user.uid} />
                      </div>
                    )}

                    {activeTab === 'calendar' && (
                      <div className="h-[700px]">
                        <CalendarView userRole="member" userId={user.uid} />
                      </div>
                    )}

                    {activeTab === 'tasks' && (
                      <div className="space-y-4">
                        {tasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 relative">
                              <CheckCircle size={40} className="text-blue-500 relative z-10" />
                              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Zero Tasks. Full Zen.</h3>
                            <p className="text-[var(--text-secondary)] max-w-xs mx-auto text-sm leading-relaxed">
                              You've cleared your plate! Time to sharpen your tools or help a teammate.
                            </p>
                            <button
                              onClick={() => navigate('/relax')}
                              className="mt-8 px-6 py-2.5 bg-[var(--bg-secondary)] text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-all font-semibold flex items-center gap-2"
                            >
                              <Coffee size={18} /> Take a Zen Break
                            </button>
                          </div>
                        ) : (
                          tasks.map(task => (
                            <motion.div
                              key={task.id}
                              layout
                              className="border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg p-4 hover:border-purple-500/30 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-medium text-[var(--text-primary)]">{task.title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded border ${task.priority === 'High' ? 'bg-red-900/30 text-red-400 border-red-900/50' :
                                      task.priority === 'Medium' ? 'bg-orange-900/30 text-orange-400 border-orange-900/50' :
                                        'bg-green-900/30 text-green-400 border-green-900/50'
                                      }`}>
                                      {task.priority}
                                    </span>
                                    {task.dueDate && (
                                      <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                        <Calendar size={12} />
                                        {(() => {
                                          const d = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : (task.dueDate ? new Date(task.dueDate) : null);
                                          if (!d || isNaN(d.getTime())) return <span>No deadline</span>;
                                        })()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-3 mb-1">
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0">
                                      {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <User size={12} className="text-[var(--text-secondary)]" />
                                      )}
                                    </div>
                                    <span className="text-[var(--text-secondary)] text-xs">Assigned to: <span className="text-[var(--text-primary)]">Self</span></span>
                                  </div>

                                  {/* Attachments */}
                                  {task.attachments && task.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {task.attachments.map((file, idx) => (                                          <a
                                            key={idx}
                                            href={isLocalAttachment(file.url) ? "#" : file.url}
                                            onClick={(e) => downloadAttachment(e, file.url, file.name)}
                                            target={isLocalAttachment(file.url) ? undefined : "_blank"}
                                            rel={isLocalAttachment(file.url) ? undefined : "noreferrer"}
                                            className="flex items-center gap-1 text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-[var(--card-bg)] text-blue-400 transition border border-[var(--border-color)]"
                                          >
                                            <Paperclip size={10} />
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                          </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {getStatusBadge(task.status)}
                              </div>

                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--text-secondary)]">Update Status:</span>
                                  {(user?.role === 'member'
                                    ? ['To Do', 'In Progress', 'Review']
                                    : ['To Do', 'In Progress', 'Done']
                                  ).map(s => (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusUpdate(task.id, s)}
                                      disabled={task.status === s || updatingTask === task.id || task.status === 'Reassignment Requested'}
                                      className={`px-3 py-1 text-xs rounded-full border transition-all ${task.status === s
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                                        } disabled:opacity-50`}
                                    >
                                      {updatingTask === task.id && task.status !== s
                                        ? <Loader2 size={12} className="animate-spin" />
                                        : (user?.role === 'member' && s === 'Review'
                                            ? (task.status === 'Review' ? 'Awaiting Review' : 'Request for Review')
                                            : s)}
                                    </button>
                                  ))}
                                </div>

                                {(() => {
                                  const due = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : (task.dueDate ? new Date(task.dueDate) : null);
                                  const isOverdue = due && due < new Date() && task.status !== 'Done';
                                  const reassignmentRequested = task.status === 'Reassignment Requested';

                                  if (reassignmentRequested) {
                                    return (
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                                        <RefreshCcw size={10} className="animate-spin-slow" />
                                        Reassignment Requested
                                      </span>
                                    );
                                  }

                                  if (isOverdue) {
                                    return (
                                      <button
                                        onClick={() => setShowReassignConfirm(task.id)}
                                        className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-[10px] font-bold border border-red-500/20 transition-all flex items-center gap-1 uppercase tracking-tight"
                                      >
                                        <RefreshCcw size={10} />
                                        Request Reassignment
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'bugs' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-[var(--text-primary)]">Reported Issues</h3>
                          <div className="flex items-center gap-2">
                            {tasks.length === 0 && (
                              <span className="text-xs text-[var(--text-secondary)] italic mr-2">
                                (Must have active tasks to report bugs)
                              </span>
                            )}
                            <button
                              onClick={() => setShowBugForm(!showBugForm)}
                              disabled={tasks.length === 0}
                              title={tasks.length === 0 ? "You must have active tasks to report bugs" : "Report a new bug"}
                              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${tasks.length === 0
                                ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed'
                                : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/30'
                                }`}
                            >
                              <Plus size={16} /> Report New Bug
                            </button>
                          </div>
                        </div>

                        {showBugForm && (
                          <div className="mb-6">
                            <BugReportForm
                              teamId={user.teamId}
                              onBugReported={(newBug) => {
                                setShowBugForm(false);
                                // Directly update state instead of triggering re-fetch
                                if (newBug) {
                                  setBugs(prev => [newBug, ...prev]);
                                } else {
                                  // Fallback if component doesn't return bug, though typically it should
                                  setRefreshBugList(p => p + 1);
                                }
                              }}
                            />
                          </div>
                        )}

                        <div className="bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4">
                          {/* Pass the fetched bugs to avoid double-fetching */}
                          <BugList
                            teamId={user.teamId}
                            role="member"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div >
          </div >
        </main >

        {/* Reassignment Modal */}
        <AnimatePresence>
          {showReassignConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center border border-red-500/30 text-red-500">
                    <AlertCircle size={24} />
                  </div>
                  <button onClick={() => setShowReassignConfirm(null)} className="text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-white mb-4">Request Task Reassignment</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  You've missed the deadline for this task. Do you want to request your leader to reassign it to someone else?
                  This will preserve the task history and context.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleRequestReassignment(showReassignConfirm)}
                    disabled={reassignLoading}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {reassignLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Request'}
                  </button>
                  <button
                    onClick={() => setShowReassignConfirm(null)}
                    className="px-6 bg-[#1e293b] hover:bg-[#2d3748] text-white font-bold rounded-xl transition-all border border-[#334155]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div >

      {/* Floating Action Button (FAB) - Member Action */}
      <motion.button
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ scale: 1.1, rotate: 12 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setActiveTab('bugs');
          setShowBugForm(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="fixed bottom-8 right-24 w-16 h-16 bg-red-600 text-white rounded-2xl shadow-[0_20px_50px_rgba(220,38,38,0.4)] flex items-center justify-center z-[90] border border-red-400/30 group"
        title="Report New Bug"
      >
        <Bug size={32} className="group-hover:scale-110 transition-transform" />
        <div className="absolute -inset-2 bg-red-500/20 rounded-2xl animate-pulse -z-10 group-hover:bg-red-500/30 transition-colors" />
      </motion.button>
    </div >
  );
}
