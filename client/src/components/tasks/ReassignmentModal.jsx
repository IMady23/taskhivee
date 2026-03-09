import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw, Calendar, User, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { TeamContext } from '../../context/TeamContext';
import TasksContext from '../../context/TasksContext';
import { toast } from 'react-hot-toast';

/**
 * ReassignmentModal - Enterprise-Grade Task Reassignment
 * Handles three reassignment options with required reason field and audit trail
 */
export default function ReassignmentModal({ isOpen, onClose, task }) {
    const { user } = useContext(AuthContext);
    const { members } = useContext(TeamContext);
    const { keepSameMember, reassignToSameMemberNewDeadline, reassignTask } = useContext(TasksContext);

    const [selectedOption, setSelectedOption] = useState(null); // 'keep' | 'extend' | 'reassign'
    const [newDeadline, setNewDeadline] = useState('');
    const [selectedMember, setSelectedMember] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // Filter out current assignee from member list
    const availableMembers = members.filter(m =>
        m.role === 'member' && m.uid !== task?.assignedTo
    );

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSelectedOption(null);
            setNewDeadline('');
            setSelectedMember('');
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!selectedOption) {
            toast.error('Please select a reassignment option');
            return;
        }

        if (reason.trim().length < 10) {
            toast.error('Reason must be at least 10 characters');
            return;
        }

        if (selectedOption === 'extend' && !newDeadline) {
            toast.error('Please select a new deadline');
            return;
        }

        if (selectedOption === 'reassign' && !selectedMember) {
            toast.error('Please select a team member');
            return;
        }

        setLoading(true);

        try {
            switch (selectedOption) {
                case 'keep':
                    await keepSameMember(task.id, reason);
                    toast.success('Task kept with same member');
                    break;

                case 'extend':
                    await reassignToSameMemberNewDeadline(task.id, newDeadline, reason);
                    toast.success('Deadline extended successfully');
                    break;

                case 'reassign':
                    const member = members.find(m => m.uid === selectedMember);
                    await reassignTask(task.id, selectedMember, member?.name || 'Unknown', newDeadline || task.dueDate, reason);
                    toast.success('Task reassigned successfully');
                    break;

                default:
                    break;
            }

            onClose();
        } catch (error) {
            console.error('Reassignment error:', error);
            toast.error('Failed to process reassignment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[#0B0F14] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] -mr-32 -mt-32"></div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                                Handle Reassignment Request
                            </h2>
                            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                                Enterprise Transparency & Accountability
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Task Info */}
                    <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl relative z-10">
                        <h3 className="text-white font-bold mb-2">{task.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                                <User size={14} />
                                {task.assignedToName || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Due: {new Date(task.dueDate || task.deadline).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {/* Option Selection */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">
                                Select Action
                            </label>

                            {/* Option 1: Keep Same Member */}
                            <button
                                type="button"
                                onClick={() => setSelectedOption('keep')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedOption === 'keep'
                                        ? 'bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/20'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedOption === 'keep' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'
                                        }`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Keep Same Member</h4>
                                        <p className="text-xs text-gray-400">Reset status to "In Progress"</p>
                                    </div>
                                </div>
                            </button>

                            {/* Option 2: Extend Deadline */}
                            <button
                                type="button"
                                onClick={() => setSelectedOption('extend')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedOption === 'extend'
                                        ? 'bg-blue-900/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedOption === 'extend' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'
                                        }`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Reassign to Same Member (New Deadline)</h4>
                                        <p className="text-xs text-gray-400">Extend deadline for current assignee</p>
                                    </div>
                                </div>
                            </button>

                            {/* Option 3: Reassign to Other Member */}
                            <button
                                type="button"
                                onClick={() => setSelectedOption('reassign')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedOption === 'reassign'
                                        ? 'bg-purple-900/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedOption === 'reassign' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-gray-400'
                                        }`}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Reassign to Other Team Member</h4>
                                        <p className="text-xs text-gray-400">Transfer task to another member</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Conditional Fields */}
                        <AnimatePresence mode="wait">
                            {selectedOption === 'extend' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                            New Deadline
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newDeadline}
                                            onChange={(e) => setNewDeadline(e.target.value)}
                                            required
                                            className="w-full bg-[#151921] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {selectedOption === 'reassign' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                            Select Team Member
                                        </label>
                                        <select
                                            value={selectedMember}
                                            onChange={(e) => setSelectedMember(e.target.value)}
                                            required
                                            className="w-full bg-[#151921] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm font-medium"
                                        >
                                            <option value="">Choose a member...</option>
                                            {availableMembers.map(member => (
                                                <option key={member.uid} value={member.uid}>
                                                    {member.name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                            New Deadline
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newDeadline}
                                            onChange={(e) => setNewDeadline(e.target.value)}
                                            required
                                            className="w-full bg-[#151921] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Required Reason Field */}
                        {selectedOption && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                    Reason for Reassignment <span className="text-red-400">*</span>
                                </label>
                                <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 mb-3">
                                    <AlertCircle className="text-amber-400 shrink-0" size={16} />
                                    <p className="text-[11px] text-amber-300 font-medium leading-relaxed">
                                        Enterprise transparency: All reassignment decisions must include a clear justification for audit trail and accountability.
                                    </p>
                                </div>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    minLength={10}
                                    rows={3}
                                    placeholder="Explain the reason for this decision (minimum 10 characters)..."
                                    className="w-full bg-[#151921] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm font-medium resize-none"
                                />
                                <p className="text-xs text-gray-500 px-1">
                                    {reason.length}/10 characters minimum
                                </p>
                            </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex gap-4">
                            <button
                                type="submit"
                                disabled={loading || !selectedOption || reason.length < 10}
                                className="flex-1 bg-white text-[#0B0F14] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCcw size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Confirm Reassignment
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-8 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
