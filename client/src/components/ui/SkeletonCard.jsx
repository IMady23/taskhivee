import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkeletonCard - A premium shimmer skeleton for metric and content cards.
 * @param {string} className - Additional CSS classes
 * @param {number} lines - Number of text shimmer lines
 */
export default function SkeletonCard({ className = "", lines = 2, hasIcon = true }) {
    return (
        <div className={`bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden ${className}`}>
            {/* Shimmer Effect */}
            <motion.div
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -z-0"
            />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="space-y-2 flex-1">
                    <div className="h-2 w-24 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-8 w-16 bg-white/10 rounded-xl animate-pulse" />
                </div>
                {hasIcon && <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse" />}
            </div>

            <div className="space-y-2 relative z-10">
                {[...Array(lines)].map((_, i) => (
                    <div
                        key={i}
                        className="h-2 bg-white/10 rounded-full animate-pulse"
                        style={{ width: `${Math.random() * (90 - 40) + 40}%` }}
                    />
                ))}
            </div>

            <div className="h-10 mt-6 bg-white/5 rounded-xl animate-pulse relative z-10" />
        </div>
    );
}
