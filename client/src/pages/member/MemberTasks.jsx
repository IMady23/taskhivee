import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TasksContext from '../../context/TasksContext';
import { CheckCircle, Calendar, Clock, AlertCircle, LayoutList, LayoutGrid, RefreshCcw, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KanbanView from '../../components/tasks/KanbanView';
import { uploadTaskSubmission } from '../../services/firestoreFileStorage';
import { toast } from 'react-hot-toast';

export default function MemberTasks() {
    const { user } = useContext(AuthContext);
    const { tasks, updateTask } = useContext(TasksContext);
    const [view, setView] = useState('list'); // 'list' | 'board'
    const [submitTaskId, setSubmitTaskId] = useState(null);
    const [submitFile, setSubmitFile] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Reassignment state
    const { requestReassignment } = useContext(TasksContext);
    const [showReassignConfirm, setShowReassignConfirm] = useState(null);
    const [reassignLoading, setReassignLoading] = useState(false);

    const handleRequestReassignment = async (taskId) => {
        setReassignLoading(true);
        await requestReassignment(taskId);
        setReassignLoading(false);
        setShowReassignConfirm(null);
    };

    if (!user || !tasks) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

    // Context already filters tasks for the member (in TasksProvider)
    const myTasks = tasks;
    const pendingTasks = myTasks.filter(t => t.status !== 'Done');
    const completedTasks = myTasks.filter(t => t.status === 'Done');

    const openSubmitModal = (taskId) => {
        setSubmitTaskId(taskId);
        setSubmitFile(null);
    };

    const handleSubmitWork = async () => {
        if (!submitTaskId) return;
        if (!submitFile) {
            toast.error('Please upload your work before submitting.');
            return;
        }

        try {
            setSubmitLoading(true);
            
            // Upload file to Firestore (fallback solution)
            const fileData = await uploadTaskSubmission(submitTaskId, submitFile, user.uid);
            
            // Update task with submission data
            await updateTask(submitTaskId, {
                status: 'Review',
                submittedForReviewAt: new Date().toISOString(),
                submissionFile: {
                    url: fileData.url,
                    name: fileData.name,
                    size: fileData.size,
                    type: fileData.type,
                    docId: fileData.docId,
                    path: fileData.path,
                    uploadedBy: user.uid,
                    uploadedByName: user.name || user.email
                }
            });
            
            toast.success('Work submitted for leader review.');
            setSubmitTaskId(null);
            setSubmitFile(null);
        } catch (error) {
            console.error("Failed to submit work:", error);
            toast.error(error.message || 'Failed to submit work. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const formatDate = (dateVal) => {
        if (!dateVal) return "No Due Date";
        // Handle Firestore Timestamp or standard Date string
        const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">My Tasks</h1>
                    <p className="text-gray-400 mt-1">Manage your assigned work and track progress</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-[#151921] border border-[#1e293b] p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <LayoutList size={16} /> List
                        </button>
                        <button
                            onClick={() => setView('board')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'board' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <LayoutGrid size={16} /> Board
                        </button>
                    </div>

                    <div className="bg-blue-900/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/30 whitespace-nowrap">
                        {pendingTasks.length} Pending
                    </div>
                </div>
            </div>

            {view === 'board' ? (
                <KanbanView tasks={myTasks} />
            ) : myTasks.length === 0 ? (
                // Empty State
                <div className="bg-[#151921] rounded-2xl p-12 text-center border border-[#1e293b] shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You have no tasks!</h3>
                    <p className="text-gray-400 max-w-md">
                        Looks like you're all caught up. Enjoy your free time or check with your leader for new assignments.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pending Tasks Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" /> In Progress & To Do
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingTasks.length > 0 ? pendingTasks.map(task => (
                                <div key={task.id} className="bg-[#151921] rounded-xl p-5 border border-[#1e293b] shadow-sm hover:shadow-md transition-shadow relative group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1">
                                            <span className={`w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                    ${task.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                                                    task.priority === 'medium' ? 'bg-orange-900/30 text-orange-400' :
                                                        'bg-blue-900/30 text-blue-400'}`}>
                                                {task.priority || 'Low'}
                                            </span>
                                            {task.status === 'Reassignment Requested' && (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                                    <RefreshCcw size={8} className="animate-spin-slow" />
                                                    REASSIGNMENT REQUESTED
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {task.id.slice(0, 6)}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" title={task.title}>
                                        {task.title}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                                        <Calendar size={14} />
                                        <span>Due: {formatDate(task.dueDate || task.deadline)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openSubmitModal(task.id)}
                                            disabled={task.status === 'Reassignment Requested' || task.status === 'Review'}
                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-600"
                                        >
                                            <CheckCircle size={16} />
                                            {task.status === 'Review' ? 'Awaiting Review' : 'Mark as Done'}
                                        </button>

                                        {(() => {
                                            const due = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : (task.dueDate ? new Date(task.dueDate) : (task.deadline ? new Date(task.deadline) : null));
                                            const isOverdue = due && due < new Date() && task.status !== 'Done';
                                            if (isOverdue && task.status !== 'Reassignment Requested') {
                                                return (
                                                    <button
                                                        onClick={() => setShowReassignConfirm(task.id)}
                                                        className="p-2.5 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40 transition-colors border border-red-500/20"
                                                        title="Request Reassignment"
                                                    >
                                                        <RefreshCcw size={16} />
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 italic col-span-full">No pending tasks. Great job!</p>
                            )}
                        </div>
                    </div>

                    {/* Completed Tasks Section - Collapsible or just listed below */}
                    {completedTasks.length > 0 && (
                        <div className="pt-6 border-t border-[#1e293b]">
                            <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-500" /> Completed
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                                {completedTasks.map(task => {
                                    // Calculate if task was completed on-time or late
                                    const completedDate = task.completedAt?.toDate ? task.completedAt.toDate() : (task.completedAt?.seconds ? new Date(task.completedAt.seconds * 1000) : null);
                                    const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : (task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : null);
                                    const isOnTime = completedDate && dueDate ? completedDate <= dueDate : null;

                                    const formatCompletionDate = (date) => {
                                        if (!date) return null;
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    };

                                    return (
                                        <div key={task.id} className="bg-[#151921] rounded-xl p-5 border border-[#1e293b]">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                                    ${task.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                                                        task.priority === 'medium' ? 'bg-orange-900/30 text-orange-400' :
                                                            'bg-blue-900/30 text-blue-400'}`}>
                                                    {task.priority || 'Low'}
                                                </span>
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {task.id.slice(0, 6)}
                                                </span>
                                            </div>

                                            <h3 className="text-gray-400 font-medium mb-3 line-through">{task.title}</h3>

                                            {/* Completion and Deadline Info */}
                                            <div className="space-y-2 mb-3">
                                                {completedDate && (
                                                    <div className={`flex items-center gap-2 text-sm ${isOnTime === true ? 'text-green-400' : isOnTime === false ? 'text-red-400' : 'text-gray-400'}`}>
                                                        <CheckCircle size={14} />
                                                        <span className="font-semibold">Completed {formatCompletionDate(completedDate)}</span>
                                                    </div>
                                                )}
                                                {dueDate && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Calendar size={14} />
                                                        <span>Deadline was {formatCompletionDate(dueDate)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`text-xs font-bold flex items-center gap-1 w-fit px-3 py-1.5 rounded-lg
                                                ${isOnTime === true ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                                                    isOnTime === false ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                                                        'bg-gray-900/30 text-gray-400 border border-gray-500/30'}`}>
                                                {isOnTime === true && '✅ ON-TIME'}
                                                {isOnTime === false && '⚠️ LATE'}
                                                {isOnTime === null && '✓ DONE'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Reassignment Modal */}
            <AnimatePresence>
                {showReassignConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#151921] border border-[#1e293b] rounded-2xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center border border-red-500/30 text-red-500">
                                    <AlertCircle size={24} />
                                </div>
                                <button onClick={() => setShowReassignConfirm(null)} className="text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4 italic uppercase">Request Reassignment</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                You've missed the deadline. Do you want to request reassignment for this task?
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleRequestReassignment(showReassignConfirm)}
                                    disabled={reassignLoading}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                >
                                    {reassignLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Request'}
                                </button>
                                <button
                                    onClick={() => setShowReassignConfirm(null)}
                                    className="px-6 bg-[#1e293b] hover:bg-[#2d3748] text-white font-bold rounded-xl transition-all border border-[#334155] uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Submit Work Modal */}
            <AnimatePresence>
                {submitTaskId && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#151921] border border-[#1e293b] rounded-2xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                                    <CheckCircle size={24} />
                                </div>
                                <button
                                    onClick={() => !submitLoading && setSubmitTaskId(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 italic uppercase">Mark Task as Done</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                                Upload your completed work (screenshot, document, or code file). Your leader will review it
                                and approve if everything looks good. <span className="text-yellow-400 font-semibold">Max file size: 1MB</span>
                            </p>

                            <div className="space-y-4 mb-6">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                                    Attach Work Artifact (Max 1MB)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && file.size > 1024 * 1024) {
                                            toast.error('File size must be less than 1MB. Please compress or use a smaller file.');
                                            e.target.value = '';
                                            setSubmitFile(null);
                                            return;
                                        }
                                        setSubmitFile(file || null);
                                    }}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-emerald-500/90 file:text-black hover:file:bg-emerald-400 bg-[#0b0f14] border border-[#1e293b] rounded-xl px-3 py-2"
                                />
                                {submitFile && (
                                    <p className="text-xs text-gray-400">
                                        Selected: <span className="font-semibold text-gray-200">{submitFile.name}</span> ({(submitFile.size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSubmitWork}
                                    disabled={submitLoading}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-60"
                                >
                                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Work'}
                                </button>
                                <button
                                    onClick={() => !submitLoading && setSubmitTaskId(null)}
                                    className="px-6 bg-[#1e293b] hover:bg-[#2d3748] text-white font-bold rounded-xl transition-all border border-[#334155] uppercase tracking-widest text-xs"
                                    disabled={submitLoading}
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
}
