import React from 'react';

/**
 * Skeleton Component
 * Provides a shimmer animation for loading placeholders.
 * 
 * @param {string} className - Tailwind classes for size and shape
 * @param {string} variant - 'text', 'circular', 'rectangular'
 */
const Skeleton = ({ className = '', variant = 'rectangular' }) => {
    const baseClasses = "relative overflow-hidden bg-black/20 backdrop-blur-xl ring-1 ring-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

    const variants = {
        text: "h-3 w-full rounded-md mb-2",
        circular: "rounded-full",
        rectangular: "rounded-xl"
    };

    return (
        <div
            className={`
        ${baseClasses} 
        ${variants[variant] || variants.rectangular} 
        ${className}
      `}
        />
    );
};

export default Skeleton;

/**
 * Add this to your tailwind.config.js or globals.css if not already present:
 * 
 * @keyframes shimmer {
 *   100% {
 *     transform: translateX(100%);
 *   }
 * }
 */
