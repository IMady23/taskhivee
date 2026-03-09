import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.icon - Lucide icon component
 * @param {string} props.title - Main heading
 * @param {string} props.description - Subtext explaining why it's empty
 * @param {string} [props.actionLabel] - Text for the CTA button
 * @param {Function} [props.onAction] - Callback for the CTA button
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center space-y-8 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] w-full min-h-[400px]"
        >
            <div className="relative">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"
                />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 flex items-center justify-center text-[var(--text-secondary)] shadow-2xl backdrop-blur-xl">
                    <Icon size={40} className="opacity-40" />
                </div>
            </div>

            <div className="space-y-3 max-w-sm">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">{title}</h3>
                <p className="text-sm font-medium text-[var(--text-secondary)] opacity-50 leading-relaxed">
                    {description}
                </p>
            </div>

            {actionLabel && onAction && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAction}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all"
                >
                    <Plus size={16} />
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    );
}
