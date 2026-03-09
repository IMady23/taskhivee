import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../services/firestoreService';
import { uploadFile } from '../services/fileService';
import { toast } from 'react-hot-toast';
import { User, Camera, Mail, Shield, Save, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { deleteAccount, canDeleteAccount } from '../services/accountService';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BADGES } from '../services/badgeService';

export default function Profile() {
    const { user, dispatch } = useContext(AuthContext);
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(user?.photoURL || null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.name || '');
            setBio(user.bio || '');
            setPreviewUrl(user.photoURL || null);
        }
    }, [user]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading('Saving local photo...');
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;

                // 1. Store in localStorage with user-specific key
                const profileData = {
                    image: base64String,
                    updatedAt: Date.now()
                };
                localStorage.setItem(`taskhive_profile_${user.email}`, JSON.stringify(profileData));

                // 2. Update local context immediately
                dispatch({
                    type: 'SET_USER',
                    payload: { ...user, photoURL: base64String }
                });

                // 3. (Optional) Sync photoURL field to Firestore if desired for "everywhere" visibility
                // but requirements say "No backend, no Firebase Storage". 
                // However, 'show everywhere' might imply other team members should see it.
                // BASE64 in Firestore is usually a bad idea, so we'll stick to local-only as per "localStorage" rule.

                setPreviewUrl(base64String);
                toast.success('Profile photo saved locally!', { id: toastId });
                setIsUploading(false);
            };
            reader.onerror = () => {
                toast.error('Failed to read file', { id: toastId });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Local save failed:', error);
            toast.error('Save failed', { id: toastId });
            setIsUploading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            const { canDelete, reason } = await canDeleteAccount();

            if (!canDelete) {
                toast.error(reason || 'Cannot delete account');
                setDeletingAccount(false);
                setShowDeleteConfirm(false);
                return;
            }

            await deleteAccount();
            toast.success('Account deleted successfully');

            // Redirect to landing page
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error(error.message || 'Failed to delete account');
            setDeletingAccount(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUserProfile(user.uid, {
                name: displayName,
                bio: bio
            });
            toast.success('Profile updated!');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
            <Sidebar role={user?.role} />
            <div className="ml-64 flex flex-col h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => navigate(user?.role === 'leader' ? '/leader/dashboard' : '/member/dashboard')}
                                className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors flex items-center justify-center text-[var(--text-primary)]"
                                title="Go Back to Dashboard"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
                        </div>

                        <div className="bg-[#1a1f2e] rounded-2xl border border-[#2d3748] p-8 shadow-xl">
                            <div className="flex flex-col items-center mb-10">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30 bg-[var(--bg-secondary)] flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                        ) : (
                                            <User className="w-16 h-16 text-[var(--text-secondary)]" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-3 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-500 transition-all shadow-lg hover:scale-110 active:scale-95 group-hover:ring-4 ring-blue-500/20">
                                        <Camera className="w-5 h-5 text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                                    <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">{user?.role}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                            Full Name
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-[#0f1419] border border-[#2d3748] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white transition-all placeholder-gray-500"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="email"
                                                value={user?.email}
                                                disabled
                                                className="w-full pl-10 pr-4 py-3 bg-[#0f1419]/50 border border-[#2d3748] rounded-xl text-gray-500 cursor-not-allowed italic"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Account Role</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-[#0f1419] border border-[#2d3748] rounded-xl">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                            <Shield className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="capitalize text-white font-medium tracking-wide">Authorized {user?.role}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Professional Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3748] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white transition-all resize-none placeholder-gray-500"
                                        placeholder="Briefly describe your role and expertise..."
                                    />
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Updating Profile...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" /> Save Profile Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Badges Section */}
                        <div className="mt-8 bg-[#1a1f2e] rounded-2xl border border-[#2d3748] p-8 shadow-xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <Shield className="w-5 h-5 text-blue-400" />
                                Achievements & Badges
                            </h3>

                            {user?.badges && user.badges.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {user.badges.map(badgeId => {
                                        const badge = Object.values(BADGES).find(b => b.id === badgeId);
                                        if (!badge) return null;
                                        return (
                                            <div key={badgeId} className="flex items-center gap-4 p-4 bg-[#0f1419] border border-[#2d3748] rounded-xl hover:border-blue-500/30 transition-all group">
                                                <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                                                    {badge.icon}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{badge.name}</h4>
                                                    <p className="text-xs text-gray-400">{badge.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 border-2 border-dashed border-[#2d3748] rounded-2xl">
                                    <p className="text-gray-400 italic">No badges earned yet. Keep up the great work!</p>
                                </div>
                            )}
                        </div>
                        {/* Danger Zone Section */}
                        <div className="mt-8 bg-red-500/5 rounded-2xl border border-red-500/20 p-8 shadow-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                                <Trash2 className="w-5 h-5" />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full px-6 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete My Account
                            </button>
                        </div>
                    </Motion.div>
                </main>
            </div>

            {/* Delete Account Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1f2e] rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <Trash2 size={28} className="text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Delete Account?</h3>
                                    <p className="text-sm text-red-400/80 font-medium italic">This action is irreversible</p>
                                </div>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 mb-8">
                                <p className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider text-[10px]">
                                    Data to be purged:
                                </p>
                                <ul className="text-sm text-gray-400 space-y-2 opacity-80">
                                    <li className="flex items-center gap-2 truncate">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Account profile information
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        All assigned tasks and history
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Team membership and associations
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Activity logs and preferences
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deletingAccount}
                                    className="flex-1 px-6 py-4 bg-[#0f1419] text-white border border-[#2d3748] rounded-xl hover:bg-[#1a1f2e] transition-all font-bold text-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deletingAccount}
                                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all font-bold text-sm shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deletingAccount ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Purging...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Confirm Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
