import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

/**
 * Premium Theme Toggle
 * Switches between Dark & Light mode with cinematic animation.
 * Persists to localStorage ('taskhive_theme').
 * 
 * Features:
 * - Glassmorphism design
 * - Smooth icon morph (Sun ↔ Moon)
 * - Optimized for performance (no context re-renders)
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  // Initialize theme on mount to avoid flicker
  useEffect(() => {
    const savedTheme = localStorage.getItem("taskhive_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.remove("light", "dark");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    // Apply class to html
    document.documentElement.classList.remove("light", "dark");
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    }

    // Persist
    localStorage.setItem("taskhive_theme", nextTheme);
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        fixed bottom-6 right-6 z-50 
        w-12 h-12 rounded-full flex items-center justify-center
        backdrop-blur-md border border-white/10 shadow-2xl
        transition-colors duration-300
        ${theme === "light"
          ? "bg-white/80 text-yellow-600 hover:shadow-lg border-black/10"
          : "bg-white/10 text-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]"
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={20} fill="currentColor" className="opacity-90" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={20} fill="currentColor" className="opacity-90" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
