import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import TeamContext from '../../context/TeamContext';
import TasksContext from '../../context/TasksContext';
import { subscribeToPresence } from '../../services/presenceService';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Activity,
  Trash2,
  ChevronRight,
  Plus,
  ArrowRight,
  Target,
  CheckCircle,
  Clock,
  Zap,
  MoreVertical
} from 'lucide-react';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import { addInvitedMember } from '../../services/teamService';

export default function LeaderTeamManagement() {
  const { user } = useContext(AuthContext);
  const { members, removeMember } = useContext(TeamContext);
  const { tasks } = useContext(TasksContext);

  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Developer' });
  const [presenceData, setPresenceData] = useState({});

  const ROLES = [
    'Lead Architect',
    'Lead Developer',
    'Backend Developer',
    'Frontend Developer',
    'Fullstack Developer',
    'QA Engineer',
    'UI/UX Designer',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager'
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to realtime presence for all members (fixes incorrect offline indicators).
  useEffect(() => {
    if (!members || members.length === 0) return;
    const memberIds = members.map((m) => m.id).filter(Boolean);
    if (memberIds.length === 0) return;

    const unsubscribe = subscribeToPresence(memberIds, (presenceMap) => {
      setPresenceData(presenceMap || {});
    });

    return () => unsubscribe();
  }, [members]);

  const getMemberStats = (memberId) => {
    // Handle missing or invalid memberId
    if (!memberId) {
      return { assigned: 0, completed: 0, efficiency: 0 };
    }
    
    const assigned = tasks.filter(t => t.assignedTo === memberId).length;
    const completed = tasks.filter(t => t.assignedTo === memberId && t.status === 'Done').length;
    const efficiency = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    return { assigned, completed, efficiency };
  };

  const isOnline = (lastActive) => {
    if (!lastActive) return false;
    const now = new Date();
    const last = new Date(lastActive.seconds * 1000 || lastActive);
    const diffMinutes = (now - last) / (1000 * 60);
    return diffMinutes < 2;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const teamDocId = user.teamId; // This is the Firestore doc ID
      await addInvitedMember(teamDocId, {
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role
      });

      toast.success(`Invitation sent to ${inviteForm.name} as ${inviteForm.role}!`);
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'Developer' });
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error.message || 'Failed to send invitation');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-[2rem] animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-12"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
              <Users className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] uppercase italic">Team {user.organization || 'Soul'}</h1>
          </div>
          <p className="text-[var(--text-secondary)] max-w-lg font-medium tracking-tight">
            Manage your elite contributors, monitor presence, and optimize squad output.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowInviteModal(true)}
          className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:bg-white/90 transition-all"
        >
          <UserPlus size={16} />
          Invite Member
        </motion.button>
      </header>

      {/* Team Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Squad', value: members.length, icon: <Users size={20} />, color: '#3b82f6', sub: 'Active Members' },
          { label: 'System Load', value: `${tasks.filter(t => t.status !== 'Done').length}`, icon: <Activity size={20} />, color: '#f59e0b', sub: 'Pending Units' },
          { label: 'Squad Peak', value: '5/5', icon: <Target size={20} />, color: '#10b981', sub: 'Capacity' },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--card-bg)] p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 rounded-2xl bg-white/5 text-[var(--text-primary)]" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--text-secondary)]">{stat.label}</span>
            </div>
            <div className="text-5xl font-black text-[var(--text-primary)] italic relative z-10">{stat.value}</div>
            <p className="text-[10px] font-black text-[var(--text-secondary)] mt-2 uppercase tracking-widest relative z-10 opacity-60">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map((member, i) => {
          const stats = getMemberStats(member.id);
          const active =
            presenceData[member.id]?.state === 'online' ||
            isOnline(member.lastActive); // fallback for legacy lastActive fields

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-[var(--card-bg)] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-6">
                <div className="relative">
                  {active && (
                    <span className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                  )}
                  <div className={`w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] ${active ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-2xl">
                    <div className="w-full h-full rounded-[1.9rem] bg-[var(--bg-primary)] flex items-center justify-center font-black text-2xl italic text-[var(--text-primary)]">
                      {member.name.charAt(0)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">{member.name}</h3>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60 mt-1">
                    <Shield size={10} className="text-indigo-400" />
                    {member.id === user.uid ? 'Lead Architect' : (member.role || 'Member')}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl w-full">
                  <Mail size={12} className="text-indigo-400 opacity-50" />
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate">{member.email || 'no-email@taskhive.ai'}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full pt-4">
                  <div className="space-y-1">
                    <div className="text-lg font-black text-[var(--text-primary)] italic">{stats.assigned}</div>
                    <div className="text-[8px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-tighter">Assigned</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-black text-emerald-400 italic">{stats.completed}</div>
                    <div className="text-[8px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-tighter">Done</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-black text-indigo-400 italic">{stats.efficiency}%</div>
                    <div className="text-[8px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-tighter">SLA Score</div>
                  </div>
                </div>

                <div className="w-full pt-6 flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/[0.08] rounded-2xl group/btn transition-all flex items-center justify-center gap-2 border border-white/5 opacity-50 cursor-not-allowed">
                    <Activity size={12} className="group-hover/btn:text-indigo-400 transition-colors" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Audit</span>
                  </button>
                  <button
                    onClick={() => removeMember(member.name)}
                    className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl group/btn transition-all flex items-center justify-center gap-2 border border-red-500/20"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {members.length < 5 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowInviteModal(true)}
            className="bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10 p-8 flex flex-col items-center justify-center space-y-4 hover:bg-white/[0.05] transition-all group min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:scale-110 group-hover:bg-white/10 transition-all">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <h4 className="font-black text-[var(--text-primary)] uppercase italic tracking-tight">Expand Squad</h4>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60 mt-1">{5 - members.length} Slots remaining</p>
            </div>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[var(--card-bg)] rounded-[3rem] border border-white/10 p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <ChevronRight size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Add Member</h3>
                  <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                    Invite a new diamond-tier member to your nexus. They will receive a unique access token.
                  </p>
                </div>

                <form onSubmit={handleInvite} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-4">Full Identity</label>
                    <input
                      type="text"
                      placeholder="e.g. Satoshi Nakamoto"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-white/5 rounded-2xl px-6 py-4 text-[var(--text-primary)] font-black italic focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-4">Secure Endpoint</label>
                    <input
                      type="email"
                      placeholder="identity@nexus.sh"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-white/5 rounded-2xl px-6 py-4 text-[var(--text-primary)] font-black italic focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-4">Strategic Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-white/5 rounded-2xl px-6 py-4 text-[var(--text-primary)] font-black italic focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer"
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role} className="bg-[#151921]">{role}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:shadow-white/10 active:scale-95 transition-all mt-8"
                  >
                    Initiate Connection
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}