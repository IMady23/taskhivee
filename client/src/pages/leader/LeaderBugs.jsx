import React, { useState, useMemo, useContext, useEffect } from 'react';
import BugList from '../../components/bugs/BugList';
import ActivityLog from '../../components/bugs/ActivityLog';
import BugsContext from '../../context/BugsContext';
import { AuthContext } from '../../context/AuthContext';
import { Bug, AlertCircle, ShieldCheck, Activity, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function LeaderBugs() {
  const { user } = useContext(AuthContext);
  const { bugs } = useContext(BugsContext);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return (bugs || []).filter((b) => {
      if (severityFilter !== 'All' && severityFilter !== 'All Severities' && b.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (search && !(`${b.title} ${b.reportedBy}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [bugs, severityFilter, statusFilter, search]);

  const severityCounts = useMemo(() => {
    const map = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    (bugs || []).forEach((b) => { map[b.severity] = (map[b.severity] || 0) + 1; });
    return map;
  }, [bugs]);

  const statusCounts = useMemo(() => {
    const map = { Open: 0, 'In Progress': 0, Resolved: 0 };
    (bugs || []).forEach((b) => { map[b.status] = (map[b.status] || 0) + 1; });
    return map;
  }, [bugs]);

  if (loading) return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="h-10 w-48 bg-white/10 rounded-xl animate-pulse mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-40 bg-white/5 rounded-3xl animate-pulse" />
        <div className="h-40 bg-white/5 rounded-3xl animate-pulse" />
      </div>
      <div className="h-96 bg-white/5 rounded-[2.5rem] animate-pulse" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-12"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-red-500/20 text-white">
              <Bug size={24} />
            </div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Incident Log</h1>
          </div>
          <p className="text-[var(--text-secondary)] max-w-lg font-medium tracking-tight">
            High-fidelity vulnerability and regression tracking for Diamond Tier stability.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-[var(--card-bg)] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-[var(--text-secondary)] flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" />
              Severity Breakdown
            </h4>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Critical', count: severityCounts.Critical, color: 'text-red-500', bg: 'bg-red-500/10' },
                { label: 'High', count: severityCounts.High, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Medium', count: severityCounts.Medium, color: 'text-amber-350', bg: 'bg-yellow-500/10' },
                { label: 'Low', count: severityCounts.Low, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
              ].map((s, i) => (
                <div key={i} className={`px-4 py-2.5 ${s.bg} ${s.color} border border-white/5 rounded-2xl flex items-center gap-3 shadow-xl`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                  <span className="text-lg font-black italic">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-[var(--card-bg)] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-[var(--text-secondary)] flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-500" />
              System Status
            </h4>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Open', count: statusCounts.Open, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'In Progress', count: statusCounts['In Progress'], color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Resolved', count: statusCounts.Resolved, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
              ].map((s, i) => (
                <div key={i} className={`px-4 py-2.5 ${s.bg} ${s.color} border border-white/5 rounded-2xl flex items-center gap-3 shadow-xl`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                  <span className="text-lg font-black italic">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-2xl border border-white/5">
          <BugList
            severityFilter={severityFilter}
            statusFilter={statusFilter}
            search={search}
            onSeverityChange={setSeverityFilter}
            onStatusChange={setStatusFilter}
            onSearchChange={setSearch}
          />
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[var(--card-bg)] rounded-[2rem] border border-white/5 p-8 shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-[var(--text-secondary)] flex items-center gap-2">
              <Activity size={14} className="text-indigo-500" />
              {(user?.organization || 'Soul')} Pulse
            </h4>
            <ActivityLog />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
