import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { subscribeToChat, sendMessage, addReaction, setTypingStatus, subscribeToTypingStatus } from '../../services/chatService';
import { getTeamMembers } from '../../services/teamService';
import { subscribeToPresence } from '../../services/presenceService';
import { Send, Paperclip, User, Smile, Reply, X, AtSign, Shield, Activity, Search, Hash, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import VoiceChannel from '../../components/chat/VoiceChannel';

export default function TeamChat() {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showVoiceChannel, setShowVoiceChannel] = useState(false);
    const [presenceData, setPresenceData] = useState({});

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const prevMsgCount = useRef(0);

    const quickReactions = ['👍', '❤️', '😂', '🔥', '🎉', '👏'];
    const emojiList = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '👏', '✨', '💯', '🚀', '💪', '🙌', '👀'];

    const getLocalFileDataUrl = (fileLocalKey) => {
        if (!fileLocalKey) return null;
        try {
            const raw = localStorage.getItem(fileLocalKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.dataUrl || null;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        if (!user?.teamId) return;
        const unsub = subscribeToChat(user.teamId, (msgs) => {
            const sorted = [...msgs].sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
                return timeA - timeB;
            });

            if (sorted.length > prevMsgCount.current) {
                const latest = sorted[sorted.length - 1];
                if (latest.senderId !== user.uid && latest.type !== 'system') {
                    import('../../utils/soundUtils').then(({ playSound }) => playSound('MESSAGE'));
                }
            }
            prevMsgCount.current = sorted.length;
            setMessages(sorted);
            setLoading(false);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsub();
    }, [user?.teamId]);

    useEffect(() => {
        if (!user?.teamId || !user?.uid) return;
        return subscribeToTypingStatus(user.teamId, user.uid, (users) => setTypingUsers(users));
    }, [user?.teamId, user?.uid]);

    useEffect(() => {
        if (!user?.teamId) return;
        getTeamMembers(user.teamId).then(m => setTeamMembers(m.filter(x => x.id !== user.uid)));
    }, [user?.teamId]);

    // Subscribe to presence for all team members
    useEffect(() => {
        if (!teamMembers || teamMembers.length === 0) return;
        
        const memberIds = teamMembers.map(m => m.id);
        const unsubscribe = subscribeToPresence(memberIds, (presenceMap) => {
            setPresenceData(presenceMap);
        });

        return () => unsubscribe();
    }, [teamMembers]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await setTypingStatus(user.teamId, user.uid, user.name || user.email, false);
            const messageData = {
                teamId: user.teamId,
                senderId: user.uid,
                senderName: user.name || user.email,
                senderRole: user.role,
                senderPhotoURL: user.photoURL || null,
                message: newMessage,
                type: 'text',
                mentions: []
            };
            if (replyingTo) messageData.replyTo = { messageId: replyingTo.id, message: replyingTo.message, senderName: replyingTo.senderName };
            await sendMessage(messageData);
            setNewMessage('');
            setReplyingTo(null);
        } catch {
            toast.error("Packet transmission failed");
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (e.target.value.trim()) {
            setTypingStatus(user.teamId, user.uid, user.name || user.email, true);
            typingTimeoutRef.current = setTimeout(() => setTypingStatus(user.teamId, user.uid, user.name || user.email, false), 3000);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📎 File selected:', file.name, file.type, file.size);

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        const uploadToast = toast.loading(`Uploading ${file.name}...`);
        
        try {
            console.log('📤 Starting upload for team:', user.teamId);
            
            // Import sendFileMessage from chatService
            const { sendFileMessage } = await import('../../services/chatService');
            
            // Upload file and send message
            await sendFileMessage(
                user.teamId,
                user.uid,
                user.name || user.email,
                user.role,
                user.photoURL || null,
                file
            );
            
            console.log('✅ Upload complete!');
            toast.success('File uploaded successfully!', { id: uploadToast });
        } catch (error) {
            console.error('❌ File upload error:', error);
            toast.error(`Failed to upload file: ${error.message}`, { id: uploadToast });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEmojiClick = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowReactionPicker(null);
        inputRef.current?.focus();
    };

    if (loading) return (
        <div className="flex gap-6 h-[75vh] animate-pulse max-w-7xl mx-auto p-4 md:p-8">
            <div className="w-64 bg-white/5 rounded-3xl" />
            <div className="flex-1 bg-white/5 rounded-3xl" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] max-w-7xl mx-auto p-4 md:p-8"
        >
            {/* Team Sidebar */}
            <div className="w-full lg:w-72 bg-[var(--card-bg)] rounded-[2rem] border border-white/5 p-6 flex flex-col shadow-2xl relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
                <div className="relative z-10 flex flex-col h-full">
                    <header className="mb-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] opacity-50 mb-4 flex items-center gap-2">
                            <Activity size={12} className="text-emerald-400" />
                            {user.organization || 'Soul'} Presence
                        </h3>
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                                    <div className="w-full h-full rounded-[0.9rem] bg-[var(--bg-primary)] flex items-center justify-center font-black text-white italic">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[var(--bg-primary)] shadow-lg" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-black text-[var(--text-primary)] uppercase italic tracking-tighter truncate">You</p>
                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-40 italic">{user.role === 'leader' ? 'Team Leader' : 'Member'}</p>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {teamMembers.map((member, i) => {
                            const isOnline = presenceData[member.id]?.state === 'online';
                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="flex items-center gap-4 p-3 hover:bg-white/[0.04] rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/5"
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-white/10 transition-colors">
                                            {member.photoURL ? <img src={member.photoURL} alt="" className="w-full h-full object-cover rounded-xl" /> : <User size={16} />}
                                        </div>
                                        {/* Real presence indicator */}
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-[var(--text-primary)] uppercase italic tracking-tighter truncate group-hover:text-white transition-colors">{member.name}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color: isOnline ? '#10b981' : '#6b7280' }}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                                            {isOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-white/5 mt-auto">
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-white transition-all">
                            Broadcast Portal
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[var(--card-bg)] rounded-[2.5rem] border border-white/5 flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                            <Hash size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)] uppercase italic tracking-tighter">{user.organization || 'Soul'} Core</h2>
                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-40">Encrypted Synchronous Data Stream</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setShowVoiceChannel(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 transition-all group shadow-lg shadow-emerald-500/5"
                        >
                            <Mic size={14} className="group-hover:animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Join Voice</span>
                        </button>
                        <div className="flex -space-x-3">
                            {[user, ...teamMembers].slice(0, 4).map((m, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-4 border-[var(--card-bg)] bg-white/10 flex items-center justify-center overflow-hidden">
                                    {m.photoURL ? <img src={m.photoURL} className="w-full h-full object-cover" /> : <div className="text-[10px] font-black">{m.name?.charAt(0)}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0B0F14]/30 custom-scrollbar pr-4">
                    {messages.map((msg, idx) => {
                        const isMe = msg.senderId === user.uid;
                        const isFileOrImage = msg.type === 'file' || msg.type === 'image';
                        const resolvedFileUrl = msg.fileURL || getLocalFileDataUrl(msg.fileLocalKey);
                        
                        // Debug logging for file messages
                        if (isFileOrImage) {
                            console.log('📨 File message:', {
                                type: msg.type,
                                fileURL: resolvedFileUrl,
                                fileName: msg.fileName,
                                message: msg.message,
                                fileLocalKey: msg.fileLocalKey
                            });
                        }
                        
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-4`}
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl">
                                    {msg.senderPhotoURL ? <img src={msg.senderPhotoURL} className="w-full h-full object-cover" /> : <User size={14} className="text-gray-600" />}
                                </div>
                                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1.5`}>
                                    <div className={`flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-50">{isMe ? 'SENDER: YOU' : msg.senderName}</span>
                                        <span className="text-[8px] text-gray-700 font-mono italic">
                                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LOGGING...'}
                                        </span>
                                    </div>
                                    <div className={`p-4 rounded-3xl shadow-2xl relative group ${isMe
                                        ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none border border-white/10'
                                        : 'bg-white/[0.03] text-[var(--text-primary)] rounded-tl-none border border-white/5'}`}>
                                        
                                        {/* Image Message */}
                                        {msg.type === 'image' && resolvedFileUrl && (
                                            <div className="space-y-2">
                                                <img 
                                                    src={resolvedFileUrl} 
                                                    alt={msg.fileName || 'Image'} 
                                                    className="max-w-sm rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(resolvedFileUrl, '_blank')}
                                                />
                                                {msg.message && msg.message !== msg.fileName && (
                                                    <p className="text-sm font-medium leading-relaxed tracking-tight">{msg.message}</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* File Message */}
                                        {msg.type === 'file' && resolvedFileUrl && (
                                            <a 
                                                href={resolvedFileUrl} 
                                                download={msg.fileName || undefined}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                            >
                                                <div className="p-3 bg-white/10 rounded-xl">
                                                    <Paperclip size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{msg.fileName || 'File'}</p>
                                                    <p className="text-xs opacity-70">Click to download</p>
                                                </div>
                                            </a>
                                        )}
                                        
                                        {/* Text Message */}
                                        {!isFileOrImage && (
                                            <p className="text-sm font-medium leading-relaxed tracking-tight">{msg.message}</p>
                                        )}

                                        {/* Quick Actions Hover */}
                                        <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-all flex gap-1.5`}>
                                            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white border border-white/5"><Reply size={12} /></button>
                                            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white border border-white/5"><Smile size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-6 bg-white/[0.02] border-t border-white/5 shrink-0">
                    <AnimatePresence>
                        {typingUsers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center gap-3 mb-4 px-2"
                            >
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{typingUsers[0].userName} Calibrating...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSend} className="relative flex items-center gap-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="flex-1 relative group">
                            <input
                                ref={inputRef}
                                value={newMessage}
                                onChange={handleTyping}
                                placeholder="SYNC MESSAGE..."
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-[var(--text-primary)] placeholder:text-gray-700 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none italic uppercase tracking-widest"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="p-2 text-gray-700 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Upload file or image"
                                >
                                    <Paperclip size={18} className={isUploading ? 'animate-pulse' : ''} />
                                </button>
                                <div className="relative">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowReactionPicker(showReactionPicker ? null : 'input')}
                                        className="p-2 text-gray-700 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                                        title="Add emoji"
                                    >
                                        <Smile size={18} />
                                    </button>
                                    {showReactionPicker === 'input' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                            className="absolute bottom-full right-0 mb-2 bg-[var(--card-bg)] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 w-64"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Select Emoji</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReactionPicker(null)}
                                                    className="p-1 hover:bg-white/10 rounded-lg transition-all"
                                                >
                                                    <X size={14} className="text-gray-600" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-8 gap-2">
                                                {emojiList.map((emoji, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleEmojiClick(emoji)}
                                                        className="text-xl hover:bg-white/10 rounded-lg p-2 transition-all hover:scale-125"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={!newMessage.trim()}
                            className="bg-white text-black p-4 rounded-2xl shadow-2xl hover:bg-white/90 disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            <Send size={20} />
                        </motion.button>
                    </form>
                </footer>
            </div>
            {/* Voice Channel Overlay */}
            <AnimatePresence>
                {showVoiceChannel && (
                    <div className="absolute top-24 right-8 z-50 w-80 shadow-2xl">
                        <VoiceChannel
                            teamId={user.teamId}
                            user={user}
                            onLeave={() => setShowVoiceChannel(false)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
