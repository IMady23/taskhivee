import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { submitLeadershipRequest } from '../services/leadershipService';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function LeadershipTransitionModal({ isOpen, onClose, teamId }) {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        proposedEmail: '',
        reason: ''
    });

    const [typoWarning, setTypoWarning] = useState('');

    const checkEmailTypo = (email) => {
        const commonTypos = {
            'gamil.com': 'gmail.com',
            'gnail.com': 'gmail.com',
            'hotmial.com': 'hotmail.com',
            'yaho.com': 'yahoo.com',
            'outook.com': 'outlook.com'
        };

        const domain = email.split('@')[1]?.toLowerCase();
        if (commonTypos[domain]) {
            setTypoWarning(`Did you mean @${commonTypos[domain]}?`);
        } else {
            setTypoWarning('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.proposedEmail || !form.reason) {
            toast.error("Please fill in all fields.");
            return;
        }

        // If there's a typo warning, prompt once but allow proceed on second click
        // Or just show the warning live (better UX)

        setLoading(true);
        try {
            await submitLeadershipRequest(teamId, user.uid, form.proposedEmail, form.reason);
            toast.success("Request submitted professionally.");
            setForm({ proposedEmail: '', reason: '' });
            setTypoWarning('');
            onClose();
        } catch (err) {
            toast.error("Submission failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-[#0B0F14] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Leadership Transition</h2>
                                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                                    A Process, Not a Revolt.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="text-blue-400 shrink-0" size={18} />
                                <p className="text-[11px] text-blue-300 font-medium leading-relaxed">
                                    Leadership transition is a formal organizational process. Your request will be recorded and a notification will be prepared for the proposed lead. This is an ethical step toward team growth.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                        Proposed Leader Email
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            value={form.proposedEmail}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setForm({ ...form, proposedEmail: val });
                                                checkEmailTypo(val);
                                            }}
                                            placeholder="e.g. lead@example.com"
                                            className="w-full bg-[#151921] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    {typoWarning && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-amber-400 text-[10px] font-bold mt-2 px-1 flex items-center gap-1"
                                        >
                                            <AlertCircle size={10} />
                                            {typoWarning}
                                        </motion.p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                        Rationale / Reason
                                    </label>
                                    <div className="relative">
                                        <MessageSquare size={16} className="absolute left-5 top-6 text-gray-500" />
                                        <textarea
                                            required
                                            value={form.reason}
                                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                            rows={4}
                                            placeholder="Why is this transition requested now?"
                                            className="w-full bg-[#151921] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm font-medium resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-white text-[#0B0F14] hover:bg-gray-200 disabled:opacity-50 font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                        <>
                                            <Send size={16} />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                            </div>

                            <p className="text-center text-[9px] text-gray-600 font-black uppercase tracking-widest">
                                “Leadership change is a process, not a revolt.”
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
