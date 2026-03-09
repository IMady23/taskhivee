import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TasksContext from '../../context/TasksContext';
import { Calendar, Filter, Info, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, User, Hash, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MemberGantt() {
    const { user } = useContext(AuthContext);
    const { tasks } = useContext(TasksContext);
    const [viewMode, setViewMode] = useState('month');
    const [filterMyTasks, setFilterMyTasks] = useState(false);
    const [filterDueSoon, setFilterDueSoon] = useState(false);
    const [filterCompleted, setFilterCompleted] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 150);
        return () => clearTimeout(timer);
    }, []);

    const filteredTasks = useMemo(() => {
        let result = (tasks || []).filter(t => t.teamId === user?.teamId);
        if (filterMyTasks) result = result.filter(t => t.assignedToUserId === user.uid || t.assignedTo === user.name);
        if (filterDueSoon) {
            const now = new Date();
            const threeDays = new Date();
            threeDays.setDate(now.getDate() + 3);
            result = result.filter(t => {
                const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate || t.deadline);
                return d > now && d <= threeDays && t.status !== 'Done';
            });
        }
        if (!filterCompleted) result = result.filter(t => t.status !== 'Done');
        return result.sort((a, b) => {
            const da = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || a.deadline || 0);
            const db = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || b.deadline || 0);
            return da - db;
        });
    }, [tasks, user, filterMyTasks, filterDueSoon, filterCompleted]);

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const timelineStart = useMemo(() => {
        const d = new Date(currentDate);
        if (viewMode === 'week') {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
        } else {
            d.setDate(1);
        }
        d.setHours(0, 0, 0, 0);
        return d;
    }, [currentDate, viewMode]);

    const timelineDays = viewMode === 'week' ? 7 : getDaysInMonth(currentDate);
    const timelineEnd = new Date(timelineStart);
    timelineEnd.setDate(timelineStart.getDate() + timelineDays);

    const getDayLabel = (index) => {
        const d = new Date(timelineStart);
        d.setDate(d.getDate() + index);
        return {
            day: d.getDate(),
            weekday: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
            isToday: new Date().toDateString() === d.toDateString()
        };
    };

    const getTaskStyle = (task) => {
        const start = task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt || new Date());
        const dateVal = task.dueDate || task.deadline;
        const end = dateVal ? (dateVal.toDate ? dateVal.toDate() : new Date(dateVal)) : new Date(start.getTime() + 86400000);

        let visualStart = start < timelineStart ? timelineStart : start;
        let visualEnd = end > timelineEnd ? timelineEnd : end;
        if (visualEnd < timelineStart || visualStart > timelineEnd) return null;

        const totalDays = timelineDays;
        const dayMs = 1000 * 60 * 60 * 24;
        const offsetMs = visualStart - timelineStart;
        const durationMs = visualEnd - visualStart;

        let left = (offsetMs / (totalDays * dayMs)) * 100;
        let width = (durationMs / (totalDays * dayMs)) * 100;
        if (width < 2) width = 2;

        let gradient = 'from-blue-500 to-indigo-600';
        if (task.status === 'Done') gradient = 'from-emerald-500 to-teal-600';
        else if (visualEnd < new Date()) gradient = 'from-red-500 to-rose-600';
        else if (task.status === 'In Progress') gradient = 'from-amber-500 to-orange-600';

        const progress = Math.min(Math.max(((new Date() - start) / (end - start)) * 100, 0), 100);

        return { left: `${left}%`, width: `${width}%`, gradient, progress, isMyTask: task.assignedToUserId === user.uid };
    };

    if (loading) return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 h-[80vh]">
            <div className="h-10 w-64 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-full bg-white/5 rounded-[3rem] animate-pulse" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-120px)]"
        >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10 mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/20 text-white">
                            <Layers size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">{user.organization || 'Soul'} Timeline</h1>
                    </div>
                    <p className="text-[var(--text-secondary)] max-w-lg font-medium tracking-tight">
                        Precision temporal mapping of {user.organization || 'the team'}'s operational velocity.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white/5 border border-white/5 p-1.5 rounded-2xl backdrop-blur-xl">
                        <button onClick={() => setViewMode('week')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'week' ? 'bg-white text-black shadow-2xl' : 'text-[var(--text-secondary)] hover:text-white'}`}>Week</button>
                        <button onClick={() => setViewMode('month')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'month' ? 'bg-white text-black shadow-2xl' : 'text-[var(--text-secondary)] hover:text-white'}`}>Month</button>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/5 px-4 py-2 text-[var(--text-primary)] font-black text-xs italic transition-all">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - (viewMode === 'week' ? 7 : 30))))} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft size={16} /></button>
                        <span className="w-40 text-center uppercase tracking-widest">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + (viewMode === 'week' ? 7 : 30))))} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </header>

            <div className="bg-[var(--card-bg)] rounded-[3rem] border border-white/5 shadow-2xl flex-1 flex flex-col overflow-hidden relative">
                {/* Custom Horizon Scroll Content */}
                <div className="flex-1 overflow-x-auto custom-scrollbar relative bg-[#0B0F14]/20">
                    <div className="min-w-[1200px] h-full flex flex-col">
                        {/* Timeline Header */}
                        <div className="flex border-b border-white/5 sticky top-0 bg-[var(--card-bg)] z-30 shadow-2xl backdrop-blur-3xl">
                            <div className="w-80 flex-shrink-0 p-6 border-r border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-50">Operation / Segment</span>
                            </div>
                            <div className="flex-1 flex">
                                {Array.from({ length: timelineDays }).map((_, i) => {
                                    const { day, weekday, isToday } = getDayLabel(i);
                                    return (
                                        <div key={i} className={`flex-1 min-w-[40px] border-r border-white/[0.03] flex flex-col items-center justify-center py-4 ${isToday ? 'bg-blue-500/5' : ''}`}>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-blue-400' : 'text-gray-700'}`}>{weekday}</span>
                                            <span className={`text-sm font-black italic ${isToday ? 'text-blue-500' : 'text-gray-500'}`}>{day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Timeline Rows */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 relative">
                            {/* Today Indicator */}
                            {(() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (today >= timelineStart && today < timelineEnd) {
                                    const daysSinceStart = Math.floor((today - timelineStart) / (1000 * 60 * 60 * 24));
                                    const leftPercent = ((daysSinceStart + 0.5) / timelineDays) * 100;
                                    return (
                                        <div 
                                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400/50 z-10 pointer-events-none"
                                            style={{ left: `calc(320px + ${leftPercent}%)` }}
                                        >
                                            <div className="absolute top-2 left-2 text-[9px] font-bold text-blue-400 uppercase tracking-wider bg-black/50 px-2 py-1 rounded">
                                                Today
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            
                            {filteredTasks.map((task, i) => {
                                const style = getTaskStyle(task);
                                if (!style) return null;
                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex border-b border-white/[0.03] group hover:bg-white/[0.02] transition-all"
                                    >
                                        <div className="w-80 flex-shrink-0 p-6 border-r border-white/5 flex flex-col justify-center bg-[var(--card-bg)] sticky left-0 z-20 shadow-2xl">
                                            <div className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tight truncate group-hover:text-white transition-colors">
                                                {task.title}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 opacity-40">
                                                <Clock size={10} className="text-indigo-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{task.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative h-20">
                                            {/* Column Guides */}
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {Array.from({ length: timelineDays }).map((_, idx) => (
                                                    <div key={idx} className="flex-1 border-r border-white/[0.02]" />
                                                ))}
                                            </div>

                                            {/* Bar Container */}
                                            <div
                                                className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-2xl shadow-2xl relative transition-all duration-200 group/bar overflow-visible cursor-pointer p-[1px] hover:h-12 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] ${style.isMyTask ? 'ring-2 ring-white/10' : ''}`}
                                                style={{ left: style.left, width: style.width }}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] opacity-80 group-hover/bar:opacity-100 transition-opacity rounded-2xl`} />
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-1000 rounded-l-2xl"
                                                    style={{ width: `${style.progress}%` }}
                                                />
                                                <div className="relative h-full flex items-center px-4 gap-2 drop-shadow-2xl">
                                                    {task.status === 'Done' ? <CheckCircle size={14} className="text-white" /> : <Hash size={12} className="text-white/60" />}
                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest truncate">{task.status}</span>
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                                                    <div className="font-bold mb-1">{task.title}</div>
                                                    <div className="text-gray-300 text-[10px]">
                                                        {task.assignedTo || 'Unassigned'} • Due: {(() => {
                                                            const dateVal = task.dueDate || task.deadline;
                                                            const end = dateVal ? (dateVal.toDate ? dateVal.toDate() : new Date(dateVal)) : new Date();
                                                            return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <footer className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center gap-6 overflow-x-auto shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40 flex items-center gap-2">
                        <Filter size={12} /> Sequence Modifiers:
                    </span>
                    <div className="flex gap-2">
                        {[
                            { label: 'My Units', state: filterMyTasks, set: setFilterMyTasks, color: 'text-indigo-400' },
                            { label: 'Critical Path', state: filterDueSoon, set: setFilterDueSoon, color: 'text-red-400' },
                            { label: 'Archived Trace', state: filterCompleted, set: setFilterCompleted, color: 'text-emerald-400' }
                        ].map((f, i) => (
                            <button
                                key={i}
                                onClick={() => f.set(!f.state)}
                                className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${f.state ? `bg-white text-black border-white` : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:border-white/20'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </footer>
            </div>
        </motion.div>
    );
}
