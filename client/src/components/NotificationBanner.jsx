import React from 'react';
import { Toaster, toast, resolveValue } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Users, Bug, Zap } from 'lucide-react';

/**
 * NotificationBanner Component
 * Custom Toaster wrapper that provides a premium glassmorphic UI for global notifications.
 */
export default function NotificationBanner() {
  const renderIcon = (type = '', toastType) => {
    if (toastType === 'success' || type.endsWith('_success')) return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (toastType === 'error' || type === 'critical') return <AlertCircle className="w-5 h-5 text-rose-500" />;

    if (type.startsWith('team')) return <Users className="w-5 h-5 text-blue-400" />;
    if (type.startsWith('bug')) return <Bug className="w-5 h-5 text-amber-500" />;
    if (type.startsWith('task')) return <CheckCircle className="w-5 h-5 text-indigo-400" />;

    return <Bell className="w-5 h-5 text-blue-400" />;
  };

  const getStyles = (type = '', toastType) => {
    if (toastType === 'success' || type.endsWith('_success')) {
      return { border: 'border-emerald-500/20', glow: 'bg-emerald-500/10' };
    }
    if (toastType === 'error' || type === 'critical') {
      return { border: 'border-rose-500/20', glow: 'bg-rose-500/10' };
    }
    if (type.startsWith('bug')) {
      return { border: 'border-amber-500/20', glow: 'bg-amber-500/10' };
    }
    return { border: 'border-white/10', glow: 'bg-blue-500/5' };
  };

  return (
    <Toaster position="top-right" reverseOrder={false}>
      {(t) => {
        const styles = getStyles(t.data?.type || t.type, t.type);
        return (
          <AnimatePresence>
            {t.visible && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }}
                className={`max-w-md w-full backdrop-blur-[20px] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto flex items-center p-5 gap-4 bg-gradient-to-br from-[#12161c]/90 to-[#0b0f14]/95 border ${styles.border}`}
              >
                {/* Visual Glow */}
                <div className={`absolute -left-10 w-20 h-20 blur-3xl opacity-20 pointer-events-none ${styles.glow}`} />

                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 relative z-10">
                  {renderIcon(t.data?.type || t.type, t.type)}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-black text-[var(--text-primary)] leading-tight tracking-tight uppercase italic mb-0.5">
                    {t.type === 'success' ? 'Nexus Update' : t.type === 'error' ? 'Operational Alert' : 'System Sync'}
                  </p>
                  <p className="text-xs font-medium text-[var(--text-secondary)] opacity-50 truncate">
                    {resolveValue(t.message, t)}
                  </p>
                </div>

                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 p-2 rounded-xl hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all relative z-10"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        );
      }}
    </Toaster>
  );
}
