import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { motion, AnimatePresence } from 'framer-motion';

export default function Celebration({ active, message, onClose }) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (active) {
      setShowConfetti(true);
      // Automatically stop confetti drops after 5 seconds to reduce memory overhead
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      const closeTimer = setTimeout(() => onClose(), 8000);
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
  }, [active, onClose]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <Confetti
            width={width}
            height={height}
            recycle={showConfetti}
            numberOfPieces={400}
            gravity={0.15}
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="bg-black/40 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.5)] text-center max-w-lg pointer-events-auto"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {message || "Milestone Reached!"}
            </h2>
            <p className="text-gray-300 font-medium">
              Excellent work! The team's productivity is operating at absolute maximum capacity.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
