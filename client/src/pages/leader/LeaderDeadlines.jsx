import React, { useContext, useState } from 'react';
import { TasksContext } from '../../context/TasksContext';
import { TeamContext } from '../../context/TeamContext';
import useCountdown from '../../hooks/useCountdown';
import { Clock, User, AlertCircle, CheckCircle, RefreshCcw, Calendar, X, Check, Loader2, ChevronDown, Bell, Send, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeadlineCard = ({ task, members, onReassign, onRemind, onSendReminder }) => {
  const dueDate = task.dueDate || task.deadline;
  const countdown = useCountdown(dueDate);
  const isDone = task.status === 'Done';

  const getAssigneeName = (id) => {
    if (!id || id === 'Unassigned') return 'Unassigned';
    const m = members.find((member) => member.id === id || member.uid === id);
    return m ? (m.name || m.email) : id;
  };

  // Color & Message Logic
  let borderColor = 'border-gray-800';
  let timerColor = 'text-gray-400';
  let statusBadgeColor = 'bg-gray-800 text-gray-400';
  let message = '';

  const reassignmentRequested = task.status === 'Reassignment Requested';

  if (isDone) {
    borderColor = 'border-blue-500/50';
    timerColor = 'text-blue-400';
    statusBadgeColor = 'bg-blue-900/30 text-blue-400';
    message = 'Well done! Task completed.';
  } else if (reassignmentRequested) {
    borderColor = 'border-purple-500';
    timerColor = 'text-purple-400';
    statusBadgeColor = 'bg-purple-900/30 text-purple-400';
    message = 'Member requested reassignment.';
  } else if (!countdown) {
    message = 'No deadline set.';
  } else if (countdown.isOverdue) {
    borderColor = 'border-red-500';
    timerColor = 'text-red-400';
    statusBadgeColor = 'bg-red-900/30 text-red-400';
    message = 'Deadline passed.';
  } else if (countdown.totalSeconds <= 3 * 24 * 3600) {
    borderColor = 'border-yellow-500';
    timerColor = 'text-yellow-400';
    statusBadgeColor = 'bg-yellow-900/30 text-yellow-400';
    message = 'Task is nearing deadline.';
  } else {
    borderColor = 'border-green-500/50';
    timerColor = 'text-green-400';
    statusBadgeColor = 'bg-green-900/30 text-green-400';
    message = 'Everything on track.';
  }

  return (
    <div className={`bg-[#0B0F14] rounded-2xl p-5 border ${borderColor} shadow-lg transition-all hover:scale-[1.01] relative overflow-hidden group`}>
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[60px] opacity-10 rounded-full transition-colors ${isDone ? 'bg-blue-500' :
        !countdown ? 'bg-gray-500' :
          countdown.isOverdue ? 'bg-red-500' :
            countdown.totalSeconds <= 3 * 24 * 3600 ? 'bg-yellow-500' : 'bg-green-500'
        }`}></div>

      <div className="flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{task.title}</h3>
            {dueDate && (
              <p className="text-[10px] text-blue-400/80 mb-2 font-medium flex items-center gap-1">
                <Calendar size={10} />
                {(() => {
                  const d = dueDate?.seconds ? new Date(dueDate.seconds * 1000) : (dueDate ? new Date(dueDate) : null);
                  if (!d || isNaN(d.getTime())) return "No Deadline";
                  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                })()}
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <User size={12} />
                {getAssigneeName(task.assignedTo)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeColor}`}>
                {task.status || 'To Do'}
              </span>
            </div>
          </div>

          {isDone ? (
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <CheckCircle size={20} />
            </div>
          ) : countdown?.isOverdue ? (
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 animate-pulse">
              <AlertCircle size={20} />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${countdown?.totalSeconds <= 3 * 24 * 3600 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
              <Clock size={20} />
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              Time Remaining
            </div>

            {isDone ? (
              <div className={`text-2xl font-mono font-bold ${timerColor}`}>
                COMPLETED
              </div>
            ) : !countdown ? (
              <div className="text-2xl font-mono font-bold text-gray-600">
                -- : -- : -- : --
              </div>
            ) : countdown.isOverdue ? (
              <div className={`text-xl font-bold ${timerColor}`}>
                {countdown.formattedOverdue}
              </div>
            ) : (
              <div className={`text-3xl font-mono font-bold flex items-center gap-2 ${timerColor}`}>
                <span>{countdown.days}</span>
                <span className="text-gray-700 text-xl">:</span>
                <span>{countdown.hours}</span>
                <span className="text-gray-700 text-xl">:</span>
                <span>{countdown.minutes}</span>
                <span className="text-gray-700 text-xl">:</span>
                <span className="w-[1.2ch]">{countdown.seconds}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs italic text-gray-500">
              {message}
            </p>

            {!isDone && onReassign && (
              <div className="flex gap-2">
                {/* Reassignment Button */}
                {(countdown?.isOverdue || reassignmentRequested) && (
                  <button
                    onClick={() => onReassign(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all border border-blue-400/20 shadow-lg shadow-blue-600/20"
                  >
                    <RefreshCcw size={12} />
                    Reassign
                  </button>
                )}

                {/* Reminder Button Logic */}
                {(() => {
                  const reminder = task.reminder;
                  if (reminder?.status === 'sent') {
                    return (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                        <Bell size={10} />
                        Reminder Sent
                      </span>
                    );
                  }

                  if (reminder?.status === 'scheduled') {
                    // Check if condition is met
                    const isOverdue = countdown?.isOverdue;
                    const isTwoHoursBefore = countdown && !isOverdue && countdown.totalSeconds <= 2 * 3600;
                    const conditionMet = (reminder.type === 'OVERDUE' && isOverdue) || (reminder.type === 'BEFORE_2_HOURS' && isTwoHoursBefore);

                    if (conditionMet) {
                      return (
                        <button
                          onClick={() => onSendReminder(task)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-[10px] font-bold transition-all animate-pulse border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        >
                          <Send size={10} />
                          Send Reminder
                        </button>
                      );
                    }
                    return (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/5 opacity-50">
                        <Bell size={10} />
                        Scheduled
                      </span>
                    );
                  }

                  // Not scheduled yet
                  return (
                    <button
                      onClick={() => onRemind(task)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151921] hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition-all border border-white/5"
                    >
                      <Bell size={12} />
                      Remind
                    </button>
                  );
                })()}

                {reassignmentRequested && (
                  <button
                    onClick={() => onReassign(task, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all border border-white/5"
                  >
                    <Check size={12} />
                    Keep Member
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LeaderDeadlines() {
  const { tasks, updateTask, reassignTask, setTaskReminder, sendTaskReminder } = useContext(TasksContext);
  const { members } = useContext(TeamContext);
  const [filter, setFilter] = useState('all'); // all, active, overdue, done
  const [reassigningTask, setReassigningTask] = useState(null);
  const [remindingTask, setRemindingTask] = useState(null);
  const [reminderType, setReminderType] = useState('BEFORE_2_HOURS');
  const [includeEmail, setIncludeEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reassignForm, setReassignForm] = useState({
    memberId: '',
    memberName: '',
    dueDate: ''
  });

  const handleReassignClick = async (task, keepMember = false) => {
    if (keepMember) {
      if (window.confirm(`Keep ${task.assignedToName || 'the member'} on this task and clear the reassignment request?`)) {
        await updateTask(task.id, {
          status: 'In Progress',
          reassignmentRequested: false, // Ensure any legacy flags are cleared
          // We can also clear the meta but keeping status changed is enough
        });
      }
      return;
    }
    setReassigningTask(task);
    setReassignForm({
      memberId: task.assignedTo || '',
      memberName: task.assignedToName || '',
      dueDate: task.dueDate ? (task.dueDate.seconds ? new Date(task.dueDate.seconds * 1000) : (task.dueDate ? new Date(task.dueDate) : '')).toISOString().slice(0, 16) : ''
    });
  };

  const handleConfirmReassign = async () => {
    if (!reassignForm.memberId || !reassignForm.dueDate) {
      alert("Please select a member and a new deadline.");
      return;
    }
    setLoading(true);
    await reassignTask(
      reassigningTask.id,
      reassignForm.memberId,
      reassignForm.memberName,
      reassignForm.dueDate
    );
    setLoading(false);
    setReassigningTask(null);
  };

  const handleSetReminder = async () => {
    if (!remindingTask) return;
    setLoading(true);
    await setTaskReminder(remindingTask.id, reminderType);
    setLoading(false);
    setRemindingTask(null);
  };

  const handleSendReminder = async (task) => {
    setLoading(true);
    // Use the includeEmail flag only if the reminder type is OVERDUE
    const emailFlag = task.reminder?.type === 'OVERDUE' ? includeEmail : false;
    await sendTaskReminder(task.id, emailFlag);
    setLoading(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'done') return t.status === 'Done';
    if (filter === 'active') return t.status !== 'Done';

    // For overdue, we need to check the date
    if (filter === 'overdue') {
      const dateVal = t.dueDate || t.deadline;
      if (!dateVal || t.status === 'Done') return false;
      const date = dateVal.seconds ? new Date(dateVal.seconds * 1000) : (dateVal ? new Date(dateVal) : null);
      return date && date < new Date();
    }
    return true;
  });

  const overdueCount = tasks.filter(t => {
    const dateVal = t.dueDate || t.deadline;
    if (!dateVal || t.status === 'Done') return false;
    const date = dateVal.seconds ? new Date(dateVal.seconds * 1000) : (dateVal ? new Date(dateVal) : null);
    return date && date < new Date();
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Calendar className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Deadlines</h1>
          </div>
          <p className="text-gray-400 max-w-lg">
            Monitor time pressure across the entire team in real-time.
          </p>
        </div>

        <div className="flex bg-[#0B0F14] p-1 rounded-xl border border-white/5 self-start">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'In Progress' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'done', label: 'Completed' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {f.label}
              {f.id === 'overdue' && overdueCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {filteredTasks.length === 0 ? (
        <div className="bg-[#0B0F14] rounded-3xl p-16 text-center border border-white/5 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-800/30 rounded-full flex items-center justify-center mb-6 border border-white/5">
            <Calendar size={32} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No Tasks Found</h3>
          <p className="text-gray-500 max-w-xs">
            There are no tasks matching your current filter in the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <DeadlineCard
              key={task.id}
              task={task}
              members={members}
              onReassign={handleReassignClick}
              onRemind={setRemindingTask}
              onSendReminder={handleSendReminder}
            />
          ))}
        </div>
      )}

      {/* Reassignment Modal */}
      <AnimatePresence>
        {reassigningTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0B0F14] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden relative"
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Adapt & Reassign</h2>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    Keep Context. Change Responsibility.
                  </p>
                </div>
                <button onClick={() => setReassigningTask(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Task</p>
                  <p className="text-white font-bold">{reassigningTask.title}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                      New Assignee
                    </label>
                    <div className="relative">
                      <select
                        value={reassignForm.memberId}
                        onChange={(e) => {
                          const m = members.find(m => (m.id || m.uid) === e.target.value);
                          setReassignForm({ ...reassignForm, memberId: e.target.value, memberName: m ? (m.name || m.email) : '' });
                        }}
                        className="w-full bg-[#151921] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 appearance-none transition-all"
                      >
                        <option value="">Select Team Member</option>
                        {members.map(m => (
                          <option key={m.id || m.uid} value={m.id || m.uid}>
                            {m.name || m.email} {m.role === 'leader' ? '(Leader)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                      New Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={reassignForm.dueDate}
                      onChange={(e) => setReassignForm({ ...reassignForm, dueDate: e.target.value })}
                      className="w-full bg-[#151921] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={handleConfirmReassign}
                    disabled={loading || !reassignForm.memberId || !reassignForm.dueDate}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/40 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <RefreshCcw size={16} />
                        Reassign Task
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setReassigningTask(null)}
                    className="px-8 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      <AnimatePresence>
        {remindingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0B0F14] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] -mr-16 -mt-16"></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Set Reminder</h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Manual Assistance Only</p>
                </div>
                <button onClick={() => setRemindingTask(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Target Task</p>
                  <p className="text-white font-bold">{remindingTask.title}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reminder Options</p>
                  <div className="space-y-2">
                    {[
                      { id: 'BEFORE_2_HOURS', label: 'Remind 2 hours before deadline' },
                      { id: 'OVERDUE', label: 'Remind when overdue' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setReminderType(opt.id)}
                        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${reminderType === opt.id
                          ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                          }`}
                      >
                        <span className="text-sm font-bold">{opt.label}</span>
                        {reminderType === opt.id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>}
                      </button>
                    ))}
                  </div>
                </div>

                {reminderType === 'OVERDUE' && (
                  <div className="flex items-center gap-3 p-4 bg-red-900/10 border border-red-500/20 rounded-2xl">
                    <input
                      type="checkbox"
                      id="emailEscalation"
                      className="w-4 h-4 accent-red-500"
                      checked={includeEmail}
                      onChange={(e) => setIncludeEmail(e.target.checked)}
                    />
                    <label htmlFor="emailEscalation" className="text-xs text-red-500 font-bold flex items-center gap-1.5 uppercase tracking-tighter cursor-pointer">
                      <Mail size={12} />
                      Include Email Escalation
                    </label>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleSetReminder}
                    disabled={loading}
                    className="w-full bg-white text-[#0B0F14] hover:bg-gray-200 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : (
                      <>
                        <Bell size={16} />
                        Schedule Reminder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
