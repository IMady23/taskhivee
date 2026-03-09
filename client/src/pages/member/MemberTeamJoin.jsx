import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, Crown, Mail, AlertCircle, CheckCircle, RefreshCcw, Calendar } from 'lucide-react';
import {
  joinTeam,
  getTeamByDocId, // Correct function for Document IDs
  getTeamMembers
} from '../../services/teamService';
import { getTeamTasks } from '../../services/taskService';

export default function MemberTeamJoin() {
  const { user, refreshToken } = useContext(AuthContext);

  // Data State
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isInvalidTeam, setIsInvalidTeam] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // STRICT CHECK: Does user have a teamId?
  const hasTeam = !!user?.teamId;

  // Define loading function inside component to be accessible
  const loadTeamOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Team Details
      // user.teamId is the Firestore Document ID, not the 6-char code
      const teamData = await getTeamByDocId(user.teamId);

      if (!teamData) {
        console.warn(`❌ Team data missing for Doc ID: ${user.teamId}.`);
        setIsInvalidTeam(true);
        setMessage({ type: 'error', text: 'Your previous team was not found. Please join a new team.' });
        setLoading(false);
        return;
      }
      setTeam(teamData);

      // 2. Fetch Members & Tasks (Parallel)
      // Pass the Document ID (user.teamId), as getTeamMembers expects Doc ID
      const [membersData, tasksData] = await Promise.all([
        getTeamMembers(user.teamId).catch(() => []),
        getTeamTasks(user.teamId).catch(() => [])
      ]);

      setMembers(membersData);
      setTeamTasks(tasksData);
      
      console.log('📊 Team Overview Data:', {
        teamName: teamData?.name,
        membersCount: membersData.length,
        members: membersData.map(m => ({ id: m.id, name: m.name, role: m.role })),
        tasksCount: tasksData.length,
        tasks: tasksData.map(t => ({ 
          id: t.id, 
          title: t.title, 
          assignedTo: t.assignedTo,
          assignedToUserId: t.assignedToUserId,
          assignedToName: t.assignedToName,
          isActive: t.isActive
        })),
        currentUserId: user.uid
      });

    } catch (err) {
      console.error("Load failed:", err);
      setError("Failed to load team data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset invalid state if user changes (e.g. re-login)
    setIsInvalidTeam(false);

    if (hasTeam) {
      loadTeamOverview();
    } else {
      setLoading(false);
    }
  }, [hasTeam, user?.teamId]);

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!teamCode.trim() || teamCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-character code' });
      return;
    }

    try {
      setJoinLoading(true);
      await joinTeam(teamCode.toUpperCase(), user.uid);
      
      // Force refresh the auth context to get updated name
      await refreshToken();
      
      // Give Firebase a moment to propagate the changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page to ensure all contexts are refreshed with new name
      window.location.reload();
      
      // Page will auto-reload via useEffect when user.teamId updates
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setJoinLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const getStatusBadge = (status) => {
    const styles = {
      'To Do': 'bg-gray-100 text-gray-700 border-gray-200',
      'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
      'Done': 'bg-green-50 text-green-700 border-green-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] border ${styles[status] || styles['To Do']} font-medium`}>
        {status}
      </span>
    );
  };

  // --- MAIN RENDER ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F14]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // CASE 1: USER IS IN A TEAM (Show Team Overview)
  // Only show if we confirm the team actually exists
  if (hasTeam && !isInvalidTeam) {
    if (error) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4 flex justify-center"><AlertCircle /></div>
          <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadTeamOverview}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCcw size={16} /> Retry
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto p-6">
        {/* HEADER: Team Info */}
        <div className="bg-[#151921] rounded-xl shadow-sm border border-[#1e293b] p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-900/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{team?.name || 'My Team'}</h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#0B0F14] px-3 py-1 rounded-full border border-[#1e293b]">
                  <Crown size={14} className="text-yellow-500" />
                  <span>Leader: <span className="font-medium text-white">{team?.leaderName || 'Unknown'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#0B0F14] px-3 py-1 rounded-full border border-[#1e293b]">
                  <Users size={14} className="text-indigo-400" />
                  <span>Members: <span className="font-medium text-white">{members.length}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT: Team Members & My Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE: All Team Members */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 px-1 flex items-center gap-2">
              <Users size={20} className="text-indigo-400" />
              Team Members
            </h2>
            <div className="space-y-4">
              {members.map(member => {
                const isLeader = member.role === 'leader';
                const isYou = member.id === user.uid;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#151921] rounded-xl shadow-sm border border-[#1e293b] overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isLeader ? 'bg-indigo-600 text-white' : 'bg-[#1e293b] text-indigo-400 border border-[#334155]'
                          }`}>
                          {member.photoURL ? (
                            <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            member.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white flex items-center gap-2">
                            {member.name}
                            {isYou && <span className="text-[10px] bg-[#334155] text-gray-300 px-1.5 rounded uppercase">You</span>}
                          </h3>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isLeader && (
                          <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-bold rounded border border-yellow-900/50 uppercase tracking-wide">
                            Team Leader
                          </span>
                        )}
                        {!isLeader && (
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded border border-blue-900/50 uppercase tracking-wide">
                            Member
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: My Tasks */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 px-1 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              My Tasks
            </h2>
            <div className="space-y-4">
              {(() => {
                // Check both assignedTo and assignedToUserId fields for compatibility
                // Treat undefined isActive as true (active) for backward compatibility
                const myTasks = teamTasks.filter(t => 
                  (t.assignedTo === user.uid || t.assignedToUserId === user.uid) && (t.isActive !== false)
                );
                
                console.log('🔍 Task Filtering Debug:', {
                  userId: user.uid,
                  totalTeamTasks: teamTasks.length,
                  myTasksCount: myTasks.length,
                  myTasks: myTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    assignedTo: t.assignedTo,
                    assignedToUserId: t.assignedToUserId,
                    isActive: t.isActive
                  })),
                  allTasksAssignments: teamTasks.map(t => ({
                    title: t.title,
                    assignedTo: t.assignedTo,
                    assignedToUserId: t.assignedToUserId,
                    isActive: t.isActive
                  }))
                });
                
                // Log each task individually for detailed inspection
                console.log('📋 All Tasks Detail:');
                teamTasks.forEach((t, idx) => {
                  console.log(`Task ${idx + 1}:`, {
                    title: t.title,
                    assignedTo: t.assignedTo,
                    assignedToUserId: t.assignedToUserId,
                    isActive: t.isActive,
                    matchesUserId: t.assignedTo === user.uid || t.assignedToUserId === user.uid
                  });
                });
                
                if (myTasks.length === 0) {
                  return (
                    <div className="bg-[#151921] rounded-xl shadow-sm border border-[#1e293b] p-8 text-center">
                      <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-400" />
                      </div>
                      <h3 className="text-white font-bold mb-2">All Clear!</h3>
                      <p className="text-gray-400 text-sm">You have no active tasks assigned</p>
                    </div>
                  );
                }

                return myTasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#151921] rounded-xl shadow-sm border border-[#1e293b] overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white flex-1">{task.title}</h3>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <Calendar size={12} />
                          Due: {(() => {
                            try {
                              // Handle Firestore Timestamp format
                              if (task.dueDate.seconds) {
                                return new Date(task.dueDate.seconds * 1000).toLocaleDateString();
                              }
                              // Handle regular Date string
                              const date = new Date(task.dueDate);
                              return isNaN(date.getTime()) ? 'No deadline' : date.toLocaleDateString();
                            } catch {
                              return 'No deadline';
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: NO TEAM (Show Join Form)
  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#151921] max-w-md w-full rounded-2xl shadow-xl p-8 border border-[#1e293b]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-12">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join a Team</h1>
          <p className="text-gray-400 mt-2">Enter the code from your team leader</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleJoinTeam} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Team Code</label>
            <input
              type="text"
              maxLength={6}
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3"
              className="w-full text-center text-2xl tracking-widest p-4 bg-[#0B0F14] border-2 border-[#1e293b] text-white rounded-xl focus:border-purple-500 focus:ring-0 uppercase placeholder:tracking-normal placeholder:text-gray-600 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={joinLoading || !teamCode}
            className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg shadow-purple-200 transition-all transform active:scale-95 ${joinLoading || !teamCode
              ? 'bg-purple-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-300'
              }`}
          >
            {joinLoading ? 'Joining...' : 'Join Team'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          Don't have a code? Ask your Team Leader.
        </div>
      </motion.div>
    </div>
  );
}