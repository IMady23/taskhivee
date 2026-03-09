import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TasksContext from '../../context/TasksContext';
import { Timer, AlertTriangle, Calendar, CheckCircle, Zap, Crosshair, ChevronDown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimeTracking() {
    const { user } = useContext(AuthContext);
    const { tasks } = useContext(TasksContext);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const myActiveTasks = (tasks || []).filter(t => t.status !== 'Done');
    const selectedTask = myActiveTasks.find(t => t.id === selectedTaskId);

    useEffect(() => {
        const dateVal = selectedTask?.dueDate || selectedTask?.deadline;

        if (!selectedTask || !dateVal) {
            setTimeLeft(null);
            return;
        }

        const calculate = () => {
            const now = new Date();
            let due;
            if (dateVal.seconds) {
                due = new Date(dateVal.seconds * 1000);
            } else if (dateVal.toDate) {
                due = dateVal.toDate();
            } else {
                due = new Date(dateVal);
            }

            if (isNaN(due.getTime())) {
                setTimeLeft(null);
                return;
            }
            const diff = due - now;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({
                total: diff,
                days,
                hours,
                minutes,
                seconds,
                isOverdue: diff < 0
            });
        };

        calculate();
        const timer = setInterval(calculate, 1000);

        return () => clearInterval(timer);
    }, [selectedTask]);

    if (loading) return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <div className="h-10 w-48 bg-white/10 rounded-xl animate-pulse mx-auto" />
            <div className="h-96 bg-white/5 rounded-[3rem] animate-pulse" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto space-y-12 relative min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8"
        >
            {/* Abstract Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [0, -90, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]"
                />
            </div>

            <div className="text-center space-y-4 mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--text-secondary)] border border-white/10">
                        <Timer size={20} />
                    </div>
                </div>
                <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Zen Chrono</h1>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] opacity-40">Absolute Focus Architecture</p>
            </div>

            {/* Task Selection Area */}
            <div className="w-full max-w-lg space-y-6">
                <div className="relative group">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3 block ml-4 opacity-50">Select Focal Point</label>
                    <div className="relative">
                        <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/5 group-hover:border-white/20 rounded-[2rem] px-8 py-5 text-[var(--text-primary)] font-black italic focus:border-indigo-500/50 transition-all outline-none appearance-none cursor-pointer text-sm shadow-2xl backdrop-blur-xl"
                        >
                            <option value="" className="bg-[var(--bg-primary)]">-- IDLE MODE --</option>
                            {myActiveTasks.map(task => (
                                <option key={task.id} value={task.id} className="bg-[var(--bg-primary)]">{task.title.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" size={20} />
                    </div>
                </div>
            </div>

            {/* Main Timer Display */}
            <div className="w-full relative flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {selectedTaskId && selectedTask ? (
                        <motion.div
                            key="timer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="bg-[var(--card-bg)] rounded-[4rem] border border-white/5 p-12 md:p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl w-full max-w-3xl relative overflow-hidden group">
                                {/* Glass Shimmer */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-50" />

                                {timeLeft ? (
                                    <div className="relative z-10">
                                        {timeLeft.isOverdue ? (
                                            <div className="space-y-6 text-center">
                                                <div className="inline-flex p-6 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse mb-4">
                                                    <AlertTriangle size={64} />
                                                </div>
                                                <h2 className="text-5xl font-black text-red-500 italic tracking-tighter uppercase">Incident Detected</h2>
                                                <div className="text-9xl font-black text-red-500 italic flex justify-center gap-4 py-8">
                                                    {Math.abs(timeLeft.days)}<span className="text-3xl mt-auto pb-6 tracking-[0.2em] font-black uppercase">Days</span>
                                                </div>
                                                <p className="text-red-400 font-medium tracking-tight mt-4 uppercase text-xs">Exceeded original deadline. System critical.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 text-emerald-400">
                                                        <Clock size={12} className="animate-spin-slow" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Flow Active</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center items-center gap-4 md:gap-8 flex-wrap">
                                                    {[
                                                        { label: 'Days', val: timeLeft.days },
                                                        { label: 'Hours', val: timeLeft.hours },
                                                        { label: 'Mins', val: timeLeft.minutes },
                                                        { label: 'Secs', val: timeLeft.seconds },
                                                    ].map((t, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <div className="flex flex-col items-center min-w-[80px] md:min-w-[120px]">
                                                                <div className="text-7xl md:text-9xl font-black italic tracking-tighter tabular-nums text-[var(--text-primary)] drop-shadow-2xl">
                                                                    {String(t.val).padStart(2, '0')}
                                                                </div>
                                                                <span className="text-[10px] md:text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mt-4 opacity-40">
                                                                    {t.label}
                                                                </span>
                                                            </div>
                                                            {idx < 3 && (
                                                                <div className="text-5xl md:text-7xl font-black text-white/5 mb-8 md:mb-12">:</div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                <div className="flex justify-center pt-8 border-t border-white/5">
                                                    <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl">
                                                        <Calendar size={16} className="text-blue-400" />
                                                        <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                                            Zero-Point: {new Date(selectedTask.dueDate || selectedTask.deadline).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-20 text-center space-y-4">
                                        <Crosshair size={48} className="mx-auto text-white/10 animate-spin-slow" />
                                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-xs">Calibrating Flow States...</p>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-12 px-10 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all flex items-center gap-3"
                            >
                                <CheckCircle size={18} />
                                Commit Unit
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-32 flex flex-col items-center gap-8 text-center"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="w-32 h-32 rounded-full border-2 border-dashed border-white/5"
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white/10">
                                    <Zap size={48} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-black text-[var(--text-secondary)] uppercase italic tracking-widest opacity-30">Idle State Active</p>
                                <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest opacity-20 max-w-xs mx-auto">Select a prioritized unit from the nexus to initiate chrono tracking.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
}
