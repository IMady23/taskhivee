import React, { useContext, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import BugsContext from '../../context/BugsContext';
import { AuthContext } from '../../context/AuthContext';
import ConfirmModal from '../ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  User,
  Clock,
  Trash2,
  ChevronRight,
  Search,
  Filter,
  Terminal,
  ExternalLink,
  AlertOctagon
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';

function SeverityBadge({ severity }) {
  const cls =
    severity === 'Critical'
      ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
      : severity === 'High'
        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        : severity === 'Medium'
          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  return <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls}`}>{severity}</div>;
}

export default function BugList({ filterByReporter, severityFilter: severityFilterProp, statusFilter: statusFilterProp, search: searchProp, onSeverityChange, onStatusChange, onSearchChange }) {
  const { bugs, updateBug, deleteBug, addBug, addActivity, requestBugDeletion } = useContext(BugsContext);
  const { user } = useContext(AuthContext);
  const [severityFilter, setSeverityFilter] = useState(severityFilterProp || 'All');
  const [statusFilter, setStatusFilter] = useState(statusFilterProp || 'All');
  const [search, setSearch] = useState(searchProp || '');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });

  const list = filterByReporter ? (bugs || []).filter((b) => b.reportedBy === filterByReporter) : (bugs || []);

  const filtered = useMemo(() => {
    return list.filter((b) => {
      if (severityFilter !== 'All' && severityFilter !== 'All Severities' && b.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (search && !(`${b.title} ${b.reportedBy}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [list, severityFilter, statusFilter, search]);

  const handleStatus = (id, e) => updateBug(id, { status: e.target.value });

  const handleDeleteClick = (id, title, status) => {
    if (user?.role === 'leader') {
      setDeleteModal({ open: true, id, title });
    } else {
      if (status === 'Resolved' || status === 'Fixed') {
        toast.promise(requestBugDeletion(id, title), {
          loading: 'Sending request...',
          success: 'Deletion request sent to leader',
          error: 'Failed to send request'
        });
      } else {
        toast.error("You can only request deletion for Resolved bugs.");
      }
    }
  };

  const handleConfirmDelete = () => {
    deleteBug(deleteModal.id);
    toast.success(`Bug "${deleteModal.title}" eliminated.`);
    setDeleteModal({ open: false, id: null, title: '' });
  };

  const handleClear = () => {
    if (onSeverityChange) onSeverityChange('All'); else setSeverityFilter('All');
    if (onStatusChange) onStatusChange('All'); else setStatusFilter('All');
    if (onSearchChange) onSearchChange(''); else setSearch('');
  };

  if (!list || list.length === 0) return (
    <EmptyState
      icon={Bug}
      title="System Integrity 100%"
      description={`Zero incidents reported in the current ${(user?.organization || 'Soul')} segment.`}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input
            value={search}
            onChange={(e) => { if (onSearchChange) onSearchChange(e.target.value); else setSearch(e.target.value); }}
            placeholder="Search incident database..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-[var(--text-primary)] font-black italic focus:border-indigo-500/30 transition-all outline-none text-xs placeholder:text-gray-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => { if (onSeverityChange) onSeverityChange(e.target.value); else setSeverityFilter(e.target.value); }}
            className="px-4 py-3.5 bg-white/[0.02] border border-white/5 text-[var(--text-secondary)] rounded-2xl focus:border-indigo-500/30 outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer appearance-none"
          >
            <option value="All">ALL SEVERITIES</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <button
            onClick={handleClear}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((b, idx) => {
          const isCritical = b.severity === 'Critical';

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex flex-col items-start p-6 rounded-[2rem] bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06] transition-all duration-300 border border-white/[0.03] hover:border-white/10 cursor-pointer relative"
            >
              {isCritical && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 rounded-full" />
              )}

              <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${b.status === 'Resolved'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isCritical
                      ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                      : 'bg-white/5 text-[var(--text-secondary)] border-white/10 group-hover:bg-white/10'
                    }`}>
                    {b.status === 'Resolved' ? <CheckCircle2 size={24} /> : isCritical ? <AlertOctagon size={24} /> : <Bug size={24} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-base font-black tracking-tight uppercase italic transition-colors ${b.status === 'Resolved' ? 'text-[var(--text-secondary)] line-through opacity-50' : 'text-[var(--text-primary)]'
                        }`}>
                        {b.title}
                      </h4>
                      <SeverityBadge severity={b.severity} />
                    </div>

                    {b.description && (
                      <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed opacity-70">
                        {b.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-indigo-400" />
                        {b.reportedBy}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-indigo-400" />
                        {b.reportedDate || 'RECENT'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {b.filePath && (
                    <div className="hidden lg:flex items-center gap-1 mr-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = `vscode://file/${b.filePath}`; }}
                        className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        title="Open in VS Code"
                      >
                        <Terminal size={14} />
                      </button>
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50 max-w-[100px] truncate ml-2">
                        {b.filePath.split('/').pop()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest shrink-0">Status</span>
                    <select
                      value={b.status}
                      onChange={(e) => handleStatus(b.id, e)}
                      className="bg-transparent text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest italic outline-none cursor-pointer"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(b.id, b.title, b.status); }}
                    className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button className="p-3 rounded-2xl bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {deleteModal.open && (
        <ConfirmModal
          title="Eliminate Bug"
          message={`Are you sure you want to scrub incident: "${deleteModal.title}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ open: false, id: null, title: '' })}
        />
      )}
    </div>
  );
}

function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
