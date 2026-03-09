import React, { useEffect, useState, useContext } from 'react';
import { calculateMemberStats } from '../../services/analyticsService';
import { getMemberTasks } from '../../services/taskService';
import { getTeamBugs } from '../../services/bugService';
import { AuthContext } from '../../context/AuthContext';
import { CheckSquare, Bug, Award, Activity, TrendingUp, Zap, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function MemberPerformance() {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const loadData = async () => {
            if (!user?.teamId) return;
            try {
                // Simulate elite delay
                const [tasks, bugs] = await Promise.all([
                    getMemberTasks(user.teamId, user.uid),
                    getTeamBugs(user.teamId),
                    new Promise(r => setTimeout(r, 150))
                ]);

                const calculated = calculateMemberStats(user.uid, tasks, bugs);
                setStats(calculated);
            } catch (err) {
                console.error("Failed to load member analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    if (loading || !stats) return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <div className="space-y-4 mb-12">
                <div className="h-10 w-48 bg-white/10 rounded-xl animate-pulse" />
                <div className="h-4 w-64 bg-white/10 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={1} hasIcon={false} />)}
            </div>
        </div>
    );

    const { myOverview, activity } = stats;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 relative"
        >
            {/* Dynamic Background Glow */}
            <motion.div
                animate={{
                    background: activeTab === 'overview' ? 'radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent)' :
                        activeTab === 'velocity' ? 'radial-gradient(circle at top right, rgba(147,51,234,0.08), transparent)' :
                            'radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent)'
                }}
                className="fixed inset-0 pointer-events-none -z-10"
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20 text-white">
                            <Activity size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Personal Pulse</h1>
                    </div>
                    <p className="text-[var(--text-secondary)] max-w-lg font-medium tracking-tight">
                        Deep-dive metrics on your contribution hierarchy and cycle trends.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-1.5 rounded-2xl flex gap-1 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-black shadow-2xl' : 'text-[var(--text-secondary)] hover:text-white'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('velocity')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'velocity' ? 'bg-white text-black shadow-2xl' : 'text-[var(--text-secondary)] hover:text-white'}`}
                    >
                        Velocity
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Primary Metric Cards - Different for each tab */}
                    {(activeTab === 'overview' ? [
                        {
                            label: 'Flow Units',
                            value: myOverview.completedTasks,
                            icon: <CheckSquare size={20} />,
                            color: '#3b82f6',
                            sub: `Total: ${myOverview.totalTasks}`,
                            data: [2, 3, 4, 5, 6, 8, myOverview.completedTasks]
                        },
                        {
                            label: 'SLA Reliability',
                            value: `${myOverview.onTimeRate}%`,
                            icon: <Award size={20} />,
                            color: '#10b981',
                            sub: `${myOverview.onTimeCount} On-time pulses`,
                            data: [60, 70, 75, 80, 85, 90, myOverview.onTimeRate]
                        },
                        {
                            label: 'Cycle Precision',
                            value: myOverview.avgCompletionTime,
                            icon: <Clock size={20} />,
                            color: '#f59e0b',
                            sub: 'Creation to Done',
                            data: [8, 7, 6, 5, 4, 3, 2]
                        }
                    ] : [
                        {
                            label: 'Sprint Velocity',
                            value: activity.tasksLast30Days,
                            icon: <Zap size={20} />,
                            color: '#a855f7',
                            sub: 'Last 30 Days',
                            data: [3, 5, 4, 8, 6, 10, activity.tasksLast30Days]
                        },
                        {
                            label: 'Task Throughput',
                            value: `${myOverview.completionRate}%`,
                            icon: <TrendingUp size={20} />,
                            color: '#ec4899',
                            sub: 'Completion Rate',
                            data: [70, 75, 78, 85, 82, 90, myOverview.completionRate]
                        },
                        {
                            label: 'Avg Cycle Time',
                            value: myOverview.avgCompletionTime,
                            icon: <Clock size={20} />,
                            color: '#f59e0b',
                            sub: 'Per Task',
                            data: [2, 4, 3, 6, 5, 8, 7]
                        }
                    ]).map((card, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="bg-[var(--card-bg)] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="p-3 rounded-2xl bg-white/5 text-[var(--text-primary)]" style={{ color: card.color }}>
                                    {card.icon}
                                </div>
                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--text-secondary)]">{card.label}</span>
                            </div>
                            <div className="text-5xl font-black text-[var(--text-primary)] italic relative z-10">{card.value}</div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] mt-2 uppercase tracking-widest relative z-10 opacity-60">{card.sub}</p>

                            {/* Sparkline */}
                            <div className="h-10 mt-8 opacity-20 group-hover:opacity-60 transition-opacity relative z-10">
                                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                    <LineChart data={card.data.map(v => ({ v }))}>
                                        <Line type="monotone" dataKey="v" stroke={card.color} strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={1000} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    ))}

                    {/* Secondary Metric Cards - Different for each tab */}
                    {(activeTab === 'overview' ? [
                        { label: '30D Velocity', value: activity.tasksLast30Days, icon: <Zap size={18} />, color: '#a855f7' },
                        { label: 'Incidents Scrubbed', value: myOverview.bugsResolved, icon: <Bug size={18} />, color: '#ef4444' },
                        { label: 'Network Output', value: `${myOverview.completionRate}%`, icon: <TrendingUp size={18} />, color: '#ec4899' },
                    ] : [
                        { label: 'Active Tasks', value: myOverview.totalTasks - myOverview.completedTasks, icon: <Activity size={18} />, color: '#3b82f6' },
                        { label: 'Late Deliveries', value: myOverview.lateCount, icon: <Clock size={18} />, color: '#ef4444' },
                        { label: 'Quality Score', value: `${myOverview.onTimeRate}%`, icon: <Shield size={18} />, color: '#10b981' },
                    ]).map((card, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 shadow-xl group flex items-center justify-between"
                        >
                            <div className="space-y-1">
                                <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[var(--text-secondary)] opacity-50">{card.label}</span>
                                <div className="text-3xl font-black text-[var(--text-primary)] italic">{card.value}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 text-[var(--text-secondary)] group-hover:bg-white/10 transition-colors" style={{ color: card.color }}>
                                {card.icon}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] text-center shadow-inner"
            >
                <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-[0.4em] italic leading-relaxed">
                    “Diamond Tier Architecture: Standardizing Outcomes across {(user?.organization || 'Soul')}.”
                </p>
            </motion.div>
        </motion.div>
    );
}
