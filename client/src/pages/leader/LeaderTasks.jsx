import React, { useState, useContext, useEffect } from 'react';
import TaskForm from '../../components/tasks/TaskForm';
import TaskList from '../../components/tasks/TaskList';
import KanbanView from '../../components/tasks/KanbanView';
import TasksContext from '../../context/TasksContext';
import { AuthContext } from '../../context/AuthContext';
import { LayoutList, LayoutGrid, Plus, Search, Filter, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function LeaderTasks() {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list');
  const { tasks } = useContext(TasksContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div className="space-y-4">
          <div className="h-10 w-48 bg-white/10 rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-white/10 rounded-full animate-pulse" />
        </div>
        <div className="h-12 w-40 bg-white/10 rounded-2xl animate-pulse" />
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-10"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 text-white">
              <Layers size={24} />
            </div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">{(user?.organization || 'Soul')} Tasks</h1>
          </div>
          <p className="text-[var(--text-secondary)] max-w-lg font-medium tracking-tight">
            High-density operational control for complex engineering flows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/5 border border-white/5 p-1.5 rounded-2xl flex gap-1 backdrop-blur-xl">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white text-black shadow-2xl' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              <LayoutList size={14} /> List
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'board' ? 'bg-white text-black shadow-2xl' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              <LayoutGrid size={14} /> Board
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/20"
          >
            <Plus size={18} /> Deploy Task
          </motion.button>
        </div>
      </header>

      <div className="relative">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-2xl border border-white/5"
            >
              <TaskList />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <KanbanView tasks={tasks} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {open && <TaskForm onClose={() => setOpen(false)} />}
    </motion.div>
  );
}
