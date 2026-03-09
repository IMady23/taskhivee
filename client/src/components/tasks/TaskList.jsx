import React, { useContext, useState } from 'react';
import TasksContext from '../../context/TasksContext';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Calendar,
  User,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ReassignmentModal from './ReassignmentModal';
import FileViewerModal from '../FileViewerModal';

function PriorityBadge({ priority }) {
  const cls = priority === 'High'
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : priority === 'Medium'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  return <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls}`}>{priority}</div>;
}

export default function TaskList() {
  const { user } = useContext(AuthContext);
  const { tasks, updateTask, deleteTask } = useContext(TasksContext);
  const [reassignmentTask, setReassignmentTask] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

  const handleStatusChange = (id, status) => {
    updateTask(id, { status });
  };

  const isOverdue = (date) => {
    if (!date) return false;
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d < new Date() && !isNaN(d.getTime());
  };

  const formatDate = (date) => {
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!tasks || tasks.length === 0) return (
    <EmptyState
      icon={CheckCircle2}
      title="Neutral Buffer State"
      description={`Zero tasks currently queued in the ${(user?.organization || 'Soul')} buffer.`}
    />
  );

  const isLeader = user?.role === 'leader';

  return (
    <>
      <div className="space-y-1">
        {tasks.map((t, idx) => {
          const overdue = isOverdue(t.dueDate || t.deadline) && t.status !== 'Done';
          const isReassignmentRequested = t.status === 'Reassignment Requested';
          const isReviewPending = t.status === 'Review';

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.06] transition-all duration-200 border ${isReassignmentRequested
                  ? 'border-purple-500/50 bg-purple-900/10 shadow-lg shadow-purple-500/10'
                  : 'border-transparent hover:border-white/5'
                } cursor-pointer relative`}
            >
              {/* Reassignment Request Indicator */}
              {isReassignmentRequested && isLeader && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
              )}

              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${t.status === 'Done'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : isReassignmentRequested
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-white/5 text-[var(--text-secondary)] group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                  {t.status === 'Done' ? (
                    <CheckCircle2 size={20} />
                  ) : isReassignmentRequested ? (
                    <RefreshCcw size={20} className="animate-spin-slow" />
                  ) : (
                    <div className="text-[10px] font-black uppercase italic tracking-tighter">0{idx + 1}</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-black tracking-tight uppercase italic transition-colors ${t.status === 'Done' ? 'text-[var(--text-secondary)] line-through opacity-50' : 'text-[var(--text-primary)]'
                    }`}>
                    {t.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 overflow-hidden flex-wrap">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1 shrink-0">
                      <User size={10} className="text-indigo-400" />
                      {t.assignedToName || t.assignedTo || (user?.organization || 'Soul') + ' Core'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                    <PriorityBadge priority={t.priority} />
                    {isReassignmentRequested && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                          <RefreshCcw size={9} />
                          REASSIGNMENT REQUESTED
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 relative z-10 w-full md:w-auto">
                {/* Due Date Badge with Overdue Pulse */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${overdue
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-white/5 border-white/5 text-[var(--text-secondary)]'
                  }`}>
                  <Clock size={12} className={overdue ? 'text-red-400' : 'text-indigo-400'} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {overdue ? 'INCIDENT: ' : ''}
                    {formatDate(t.dueDate || t.deadline)}
                  </span>
                </div>

                {/* Review Actions (Leader only) */}
                {isLeader && isReviewPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Check if submission file exists
                        if (!t.submissionFile || !t.submissionFile.url) {
                          alert('No submitted work found for this task.');
                          return;
                        }
                        // Open file viewer modal
                        setViewingFile(t.submissionFile);
                      }}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest rounded-xl border border-white/10"
                    >
                      View Submission
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTask(t.id, {
                          status: 'Done',
                          reviewedAt: new Date().toISOString(),
                          reviewDecision: 'approved',
                          completedAt: new Date().toISOString()
                        });
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTask(t.id, {
                          status: 'In Progress',
                          reviewedAt: new Date().toISOString(),
                          reviewDecision: 'rejected'
                        });
                      }}
                      className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-rose-500/30"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Reassignment Button for Leaders */}
                {isReassignmentRequested && isLeader && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setReassignmentTask(t); }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                  >
                    <RefreshCcw size={12} />
                    Handle Reassignment
                  </button>
                )}

                {/* Status Select (disabled for reassignment requested) */}
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  disabled={isReassignmentRequested}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-white/5 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="To Do">TO DO</option>
                  <option value="In Progress">IN PROG</option>
                  <option value="Review">REVIEW</option>
                  <option value="Done">DONE</option>
                </select>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}
                    className="p-2.5 rounded-xl hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button className="p-2.5 rounded-xl hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reassignment Modal */}
      <ReassignmentModal
        isOpen={!!reassignmentTask}
        onClose={() => setReassignmentTask(null)}
        task={reassignmentTask}
      />

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={!!viewingFile}
        onClose={() => setViewingFile(null)}
        file={viewingFile}
      />
    </>
  );
}
