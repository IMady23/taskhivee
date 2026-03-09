import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { TasksContext } from '../../context/TasksContext';
import useCountdown from '../../hooks/useCountdown';
import { Clock, CheckCircle, AlertCircle, Calendar, Sparkles, RefreshCcw, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MemberDeadlineCard = ({ task }) => {
  const dueDate = task.dueDate || task.deadline;
  const countdown = useCountdown(dueDate);
  const isDone = task.status === 'Done';

  const { requestReassignment } = useContext(TasksContext);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    await requestReassignment(task.id);
    setLoading(false);
    setShowConfirm(false);
  };

  const reassignmentRequested = task.status === 'Reassignment Requested';

  // Color & Message Logic
  let borderColor = 'border-gray-800';
  let timerColor = 'text-gray-400';
  let badgeColor = 'bg-gray-800 text-gray-400';
  let message = '';
  let icon = <Clock size={20} />;

  if (isDone) {
    borderColor = 'border-blue-500/50';
    timerColor = 'text-blue-400';
    badgeColor = 'bg-blue-900/30 text-blue-400';
    message = 'Well done! Task completed.';
    icon = <CheckCircle size={20} />;
  } else if (reassignmentRequested) {
    borderColor = 'border-purple-500/50';
    timerColor = 'text-purple-400';
    badgeColor = 'bg-purple-900/30 text-purple-400';
    message = 'Reassignment requested. Waiting for leader.';
    icon = <RefreshCcw size={20} className="text-purple-400 animate-spin-slow" />;
  } else if (!countdown) {
    message = 'No deadline set.';
  } else if (countdown.isOverdue) {
    borderColor = 'border-red-500';
    timerColor = 'text-red-400';
    badgeColor = 'bg-red-900/30 text-red-400';
    message = 'Deadline passed — inform your leader.';
    icon = <AlertCircle size={20} className="animate-pulse" />;
  } else if (countdown.totalSeconds <= 3 * 24 * 3600) {
    borderColor = 'border-yellow-500';
    timerColor = 'text-yellow-400';
    badgeColor = 'bg-yellow-900/30 text-yellow-400';
    message = 'Focus now, you’re close.';
    icon = <Clock size={20} className="text-yellow-400" />;
  } else {
    borderColor = 'border-green-500/50';
    timerColor = 'text-green-400';
    badgeColor = 'bg-green-900/30 text-green-400';
    message = 'Plenty of time — stay consistent.';
    icon = <Clock size={20} className="text-green-400" />;
  }

  return (
    <div className={`bg-[#0B0F14] rounded-2xl p-6 border ${borderColor} shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all`}>
      <div className={`absolute -right-8 -top-8 w-24 h-24 blur-[50px] opacity-10 rounded-full ${isDone ? 'bg-blue-500' :
        !countdown ? 'bg-gray-500' :
          countdown.isOverdue ? 'bg-red-500' :
            countdown.totalSeconds <= 3 * 24 * 3600 ? 'bg-yellow-500' : 'bg-green-500'
        }`}></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{task.title}</h3>
            {dueDate && (
              <p className="text-[10px] text-blue-400/80 mb-3 font-medium flex items-center gap-1">
                <Calendar size={10} />
                {(() => {
                  const d = dueDate?.seconds ? new Date(dueDate.seconds * 1000) : (dueDate ? new Date(dueDate) : null);
                  if (!d || isNaN(d.getTime())) return "No Deadline";
                  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                })()}
              </p>
            )}
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColor}`}>
              {task.status || 'To Do'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 group-hover:border-blue-500/30 transition-colors">
            {icon}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
              Time Remaining
            </p>
            {isDone ? (
              <div className="space-y-3">
                <div className="text-3xl font-black text-blue-400 tracking-tight italic">
                  MISSION COMPLETE
                </div>
                {/* Show completion date and deadline comparison */}
                {(() => {
                  const completedDate = task.completedAt?.toDate ? task.completedAt.toDate() : (task.completedAt?.seconds ? new Date(task.completedAt.seconds * 1000) : null);
                  const deadlineDate = dueDate?.seconds ? new Date(dueDate.seconds * 1000) : (dueDate ? new Date(dueDate) : null);
                  const isOnTime = completedDate && deadlineDate ? completedDate <= deadlineDate : null;

                  const formatDate = (date) => {
                    if (!date) return null;
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  };

                  return (
                    <div className="space-y-2 text-sm">
                      {completedDate && (
                        <div className={`flex items-center gap-2 ${isOnTime === true ? 'text-green-400' : isOnTime === false ? 'text-red-400' : 'text-gray-400'}`}>
                          <CheckCircle size={14} />
                          <span className="font-semibold">Completed {formatDate(completedDate)}</span>
                        </div>
                      )}
                      {deadlineDate && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar size={14} />
                          <span>Deadline was {formatDate(deadlineDate)}</span>
                        </div>
                      )}
                      {isOnTime !== null && (
                        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${isOnTime ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                          {isOnTime ? '✅ COMPLETED ON-TIME' : '⚠️ COMPLETED LATE'}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : !countdown ? (
              <div className="text-3xl font-mono font-bold text-gray-700">
                STAY TUNED
              </div>
            ) : countdown.isOverdue ? (
              <div className="text-xl font-black text-red-400 uppercase tracking-tight">
                {countdown.formattedOverdue}
              </div>
            ) : (
              <div className={`text-4xl font-mono font-black flex items-center gap-2 ${timerColor}`}>
                <span>{countdown.days}</span>
                <span className="text-gray-800 text-2xl">:</span>
                <span>{countdown.hours}</span>
                <span className="text-gray-800 text-2xl">:</span>
                <span>{countdown.minutes}</span>
                <span className="text-gray-800 text-2xl">:</span>
                <span className="w-[1.2ch]">{countdown.seconds}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Sparkles size={14} className={isDone ? 'text-blue-400' : 'text-gray-600'} />
              <span className="italic">{message}</span>
            </div>

            {countdown?.isOverdue && !isDone && !reassignmentRequested && (
              <button
                onClick={() => setShowConfirm(true)}
                className="px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-[10px] font-bold border border-red-500/20 transition-all flex items-center gap-1"
              >
                <RefreshCcw size={10} />
                REQUEST REASSIGNMENT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0B0F14] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 flex items-center justify-center border border-red-500/30">
                  <AlertCircle className="text-red-500" size={24} />
                </div>
                <button onClick={() => setShowConfirm(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-4">
                Deadline Missed
              </h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                You've missed the deadline for <span className="text-white font-bold">"{task.title}"</span>.
                Do you want to request reassignment to another team member?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Request Reassignment'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MemberDeadlines() {
  const { user } = useContext(AuthContext);
  const { tasks } = useContext(TasksContext);

  // Member sees only their assigned tasks (filtered by TasksContext based on assignedTo === user.uid)
  // We just need to handle the display

  const activeTasks = tasks.filter(t => t.status !== 'Done');
  const completedTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="relative py-10 overflow-hidden rounded-3xl bg-[#0B0F14] border border-white/5 px-8 md:px-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 border border-blue-400/20">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase">My Deadlines</h1>
              <p className="text-blue-500 font-bold text-sm tracking-widest uppercase mt-1">
                Track how much time is left to complete tasks
              </p>
            </div>
          </div>
          <p className="text-gray-400 max-w-xl text-lg font-medium leading-relaxed">
            Every second counts. Stay focused on your goals and deliver your best work before the clock runs out.
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Active Missions</h2>
            <div className="h-px flex-1 bg-white/5"></div>
            <span className="text-xs font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-400/10">
              {activeTasks.length} PENDING
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="bg-[#0B0F14] rounded-3xl p-16 text-center border border-white/5 border-dashed">
              <div className="w-20 h-20 bg-green-900/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase italic">No deadlines found!</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                You're all caught up. Take a moment to breathe or start a new challenge.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTasks.map(task => (
                <MemberDeadlineCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div className="pt-12">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Completed</h2>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 hover:opacity-100 transition-opacity">
              {completedTasks.map(task => (
                <MemberDeadlineCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
