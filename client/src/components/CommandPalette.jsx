import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Command,
    Hash,
    User,
    Settings,
    LogOut,
    Layout,
    Bug,
    CheckCircle,
    Plus,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onClose(!isOpen);
            }
            if (e.key === 'Escape') onClose(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const actions = [
        { id: 'dash', title: 'Go to Dashboard', icon: Layout, shortcut: 'G D', handler: () => navigate(user?.role === 'leader' ? '/leader/dashboard' : '/member/dashboard') },
        { id: 'profile', title: 'Manage Profile', icon: User, shortcut: 'G P', handler: () => navigate('/profile') },
        { id: 'bugs', title: 'Report Issue', icon: Bug, shortcut: 'C B', handler: () => navigate('/member/dashboard?tab=bugs') },
        { id: 'status', title: 'Update Status', icon: Sparkles, shortcut: 'S S', handler: () => { } },
        { id: 'logout', title: 'Sign Out', icon: LogOut, shortcut: '⌥ L', handler: logout },
    ].filter(action => action.title.toLowerCase().includes(query.toLowerCase()));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/40"
                onClick={() => onClose(false)}
            >
                <motion.div
                    initial={{ scale: 0.95, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: -20 }}
                    className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden shadow-blue-500/10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Header */}
                    <div className="flex items-center px-6 py-5 border-b border-white/5">
                        <Command className="w-5 h-5 text-blue-500 mr-4" />
                        <input
                            autoFocus
                            className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full text-lg placeholder-white/20 font-medium"
                            placeholder="Type a command or search..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] items-center flex font-bold text-white/40">ESC</span>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar">
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                            Navigation & Actions
                        </div>
                        {actions.length > 0 ? (
                            actions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => { action.handler(); onClose(false); }}
                                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-white/5 group transition-all text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                            <action.icon className="w-4 h-4 text-white/60 group-hover:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{action.title}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {action.shortcut.split(' ').map(s => (
                                            <span key={s} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white/30 uppercase">{s}</span>
                                        ))}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Search className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                <p className="text-white/20 text-sm font-medium">No commands found for "{query}"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-white/30">
                            <span className="flex items-center gap-1"><ArrowRight size={10} /> Select</span>
                            <span className="flex items-center gap-1"><ArrowRight size={10} className="rotate-90" /> Navigate</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 italic">
                            <Sparkles size={10} /> Powered by Gravity Engine
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CommandPalette;
