import React, { useContext } from 'react';
import { motion, Reorder } from 'framer-motion';
import { MoreVertical, Calendar, User, Clock, CheckCircle2, Circle, PlayCircle, AlertCircle } from 'lucide-react';
import TasksContext from '../../context/TasksContext';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const KanbanView = ({ tasks }) => {
    const { updateTask } = useContext(TasksContext);
    const { user } = useContext(AuthContext);

    const columns = [
        { id: 'To Do', icon: <Circle className="text-gray-400" size={18} />, bg: 'bg-zinc-900/50' },
        { id: 'In Progress', icon: <PlayCircle className="text-blue-500" size={18} />, bg: 'bg-blue-500/5' },
        { id: 'Review', icon: <AlertCircle className="text-amber-500" size={18} />, bg: 'bg-amber-500/5' },
        { id: 'Done', icon: <CheckCircle2 className="text-green-500" size={18} />, bg: 'bg-green-500/5' }
    ];

    const handleStatusMove = async (taskId, newStatus) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Members can't permanently complete tasks: they submit for review instead.
        const mappedStatus = (user?.role === 'member' && newStatus === 'Done') ? 'Review' : newStatus;
        const updates = { status: mappedStatus };

        if (mappedStatus === 'Review' && task.status !== 'Review') {
            // Require an attachment before submitting for review when using the board.
            if (user?.role === 'member' && !task.attachmentLocalKey) {
                toast.error('Please open the task in list view and upload your work before submitting for review.');
                return;
            }
            updates.submittedForReviewAt = new Date().toISOString();
        }

        await updateTask(taskId, updates);
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar h-[calc(100vh-250px)] min-w-full">
            {columns.map(col => (
                <div
                    key={col.id}
                    className={`flex-1 min-w-[320px] rounded-2xl border border-[#1e293b] flex flex-col ${col.bg} backdrop-blur-sm`}
                >
                    <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {col.icon}
                            <h3 className="font-bold text-white text-sm uppercase tracking-widest">{col.id}</h3>
                            <span className="bg-[#1e293b] text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>
                        <MoreVertical size={16} className="text-gray-500 cursor-pointer" />
                    </div>

                    <div className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
                        {tasks
                            .filter(t => t.status === col.id)
                            .map(task => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={task.id}
                                    className="bg-[#1a1f26] border border-[#2d3748] rounded-xl p-4 shadow-sm hover:border-blue-500/50 transition-all group relative cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                            task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {task.priority || 'Low'}
                                        </span>
                                        <div className="flex gap-1">
                                            {(() => {
                                                const canBack = col.id !== 'To Do' && !(user?.role === 'member' && col.id === 'Done');
                                                if (!canBack) return null;
                                                const backTarget =
                                                    col.id === 'Done' ? 'Review' :
                                                    col.id === 'Review' ? 'In Progress' :
                                                    'To Do';
                                                return (
                                                <button
                                                    onClick={() => handleStatusMove(task.id, backTarget)}
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 text-gray-400 hover:text-white"
                                                    title="Move Back"
                                                >
                                                    ←
                                                </button>
                                                );
                                            })()}
                                            {(() => {
                                                const canForward =
                                                    col.id !== 'Done' &&
                                                    !(user?.role === 'member' && col.id === 'Review'); // members can't push review -> done
                                                if (!canForward) return null;

                                                const forwardTarget =
                                                    col.id === 'To Do' ? 'In Progress' :
                                                    col.id === 'In Progress' ? 'Review' :
                                                    'Done';

                                                return (
                                                <button
                                                    onClick={() => handleStatusMove(task.id, forwardTarget)}
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 text-gray-400 hover:text-white"
                                                    title="Move Forward"
                                                >
                                                    →
                                                </button>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <h4 className="text-white font-semibold text-sm leading-snug group-hover:text-blue-400 transition-colors">
                                        {task.title}
                                    </h4>

                                    <div className="mt-4 pt-4 border-t border-[#2d3748] flex items-center justify-between text-[11px] text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                                                <User size={10} />
                                            </div>
                                            <span>{task.assigneeName || task.assignedTo || 'Unassigned'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{task.deadline ? new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanView;
