import React, { useEffect, useState, useContext } from 'react';
import { calculateTeamStats } from '../../services/analyticsService';
import TasksContext from '../../context/TasksContext';
import BugsContext from '../../context/BugsContext';
import TeamContext from '../../context/TeamContext';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { useSocket } from '../../context/SocketContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  BarChart as BarChartIcon,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCcw,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeaderPerformance() {
  const { tasks, fetchTasks } = useContext(TasksContext);
  const { bugs } = useContext(BugsContext);
  const { members, currentTeam } = useContext(TeamContext);
  const socket = useSocket();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate stats whenever data changes
  useEffect(() => {
    if (tasks && bugs && members) {
      // Simulate slight delay for "Elite" entrance
      const timer = setTimeout(() => {
        const calculated = calculateTeamStats(tasks, bugs, members);
        setStats(calculated);
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tasks, bugs, members]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket || !currentTeam) return;

    // Join team room
    socket.emit('join:team', currentTeam.id);

    // Listen for task updates
    const handleTaskUpdate = () => {
      console.log('📊 Task updated, refreshing stats...');
      fetchTasks && fetchTasks();
    };

    const handleWorkloadUpdate = () => {
      console.log('📊 Workload updated, refreshing stats...');
      fetchTasks && fetchTasks();
    };

    socket.on('task:updated', handleTaskUpdate);
    socket.on('workload:updated', handleWorkloadUpdate);

    return () => {
      socket.off('task:updated', handleTaskUpdate);
      socket.off('workload:updated', handleWorkloadUpdate);
      socket.emit('leave:team', currentTeam.id);
    };
  }, [socket, currentTeam, fetchTasks]);

  if (loading || !stats) return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-2 mb-8">
        <div className="h-4 w-32 bg-white/10 rounded-full animate-pulse" />
        <div className="h-10 w-64 bg-white/10 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-80 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
        <div className="h-80 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
      </div>
    </div>
  );

  const { overview, memberTaskStats } = stats;

  const velocityData = [
    { name: 'On-Time', value: overview.onTimeCount, color: '#22c55e' },
    { name: 'Late', value: overview.lateCount, color: '#ef4444' },
    { name: 'Reassigned', value: overview.reassignedCount, color: '#a855f7' }
  ].filter(d => d.value > 0);

  if (velocityData.length === 0) {
    velocityData.push({ name: 'No Data', value: 1, color: 'rgba(255,255,255,0.05)' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12 p-4 md:p-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
              <Zap className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] uppercase italic">Diamond Analytics</h1>
          </div>
          <p className="text-[var(--text-secondary)] max-w-lg font-medium tracking-tight">
            Advanced outcome metrics powered by TaskHive's Diamond Tier intelligence.
          </p>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Output', value: overview.totalTasks, icon: <TrendingUp size={18} />, color: '#3b82f6', data: [10, 15, 12, 18, 14, 22, 20] },
          { label: 'SLA Reliability', value: `${overview.completionRate}%`, icon: <CheckCircle size={18} />, color: '#10b981', data: [65, 72, 68, 85, 80, 92, 90] },
          { label: 'Performance Pace', value: memberTaskStats[0]?.avgCompletionTime || '0m', icon: <Clock size={18} />, color: '#f59e0b', data: [5, 8, 6, 12, 10, 15, 14] },
          { label: 'Stability Index', value: overview.resolvedBugs, icon: <Award size={18} />, color: '#8b5cf6', data: [2, 5, 3, 8, 6, 10, 9] },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--text-secondary)]">{card.label}</span>
              <div className="p-2 rounded-xl bg-white/5 text-[var(--text-primary)] group-hover:scale-110 transition-transform" style={{ color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div className="text-4xl font-black text-[var(--text-primary)] italic relative z-10">{card.value}</div>

            {/* Sparkline */}
            <div className="h-10 mt-6 opacity-20 group-hover:opacity-60 transition-opacity relative z-10">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <LineChart data={card.data.map(v => ({ v }))}>
                  <Line type="monotone" dataKey="v" stroke={card.color} strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* On-Time Completion (Bar Chart) */}
        <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 space-y-10 h-full flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3">
                  <BarChartIcon size={24} className="text-emerald-500" />
                  Efficiency Map
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-black mt-2">Team-wide completion distribution</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                Active Cycle
              </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <BarChart data={memberTaskStats} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#ffffff', fontStyle: 'italic', fontWeight: 'bold' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#ffffff' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                    contentStyle={{
                      backgroundColor: 'rgba(11, 15, 20, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#10b981', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Bar dataKey="onTime" radius={[6, 6, 0, 0]} barSize={32}>
                    {memberTaskStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Team Velocity (Donut Chart) */}
        <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 space-y-10 h-full flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3">
                  <RefreshCcw size={24} className="text-purple-500" />
                  Velocity Pulse
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-black mt-2">Operational adaptiveness Index</p>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <PieChart>
                  <Pie
                    data={velocityData}
                    innerRadius={90}
                    outerRadius={115}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={1500}
                  >
                    {velocityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(11, 15, 20, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#ffffff'
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: '#ffffff' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-5xl font-black text-[var(--text-primary)] italic mt-[-20px]">{overview.completedTasks}</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.3em]">Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Outcomes Table */}
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Outcome Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {memberTaskStats.slice(0, 5).map((m, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--bg-primary)] bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xl">
                  {m.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black bg-white/10 text-[var(--text-primary)] px-4 py-2 rounded-xl border border-white/10 tracking-[0.2em]">
              {memberTaskStats.length} CONTRIBUTORS
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01]">
                {['Contributor', 'Velocity', 'SLA Score', 'Cycle Time', 'Friction'].map(h => (
                  <th key={h} className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {memberTaskStats.map(member => (
                <tr key={member.id} className="hover:bg-white/[0.03] transition-all duration-300 group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-black text-[var(--text-primary)] group-hover:scale-110 transition-transform">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-black text-[var(--text-primary)] group-hover:text-blue-400 transition-colors uppercase tracking-tight text-base italic">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="text-lg font-black text-[var(--text-primary)]">{member.completed} <span className="text-[10px] text-[var(--text-secondary)] uppercase">Completed</span></span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${member.onTimeRate}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        />
                      </div>
                      <span className="text-sm font-black text-emerald-400 italic">{member.onTimeRate}%</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className="text-xs font-black text-[var(--text-secondary)] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{member.avgCompletionTime}</span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${member.reassigned > 0
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                      {member.reassigned > 0 ? `${member.reassigned} Reassigned` : 'No Friction'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
