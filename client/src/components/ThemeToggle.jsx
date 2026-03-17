import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Zap, Briefcase } from "lucide-react";

/**
 * Premium Advanced Theme Toggle
 * Cycles between Light, Dark, Cyberpunk, and Corporate modes.
 * Persists to localStorage ('taskhive_advanced_theme').
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  
  const themes = ["light", "dark", "theme-cyberpunk", "theme-corporate"];

  // Initialize theme on mount to avoid flicker
  useEffect(() => {
    const savedTheme = localStorage.getItem("taskhive_advanced_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.remove(...themes);
    if (savedTheme !== "light") {
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    setTheme(nextTheme);

    // Apply class to html
    document.documentElement.classList.remove(...themes);
    if (nextTheme !== "light") {
      document.documentElement.classList.add(nextTheme);
    }

    // Persist
    localStorage.setItem("taskhive_advanced_theme", nextTheme);
  };

  const currentIcon = () => {
    switch(theme) {
        case "light": return <Sun size={20} fill="currentColor" className="opacity-90" />;
        case "dark": return <Moon size={20} fill="currentColor" className="opacity-90" />;
        case "theme-cyberpunk": return <Zap size={20} fill="currentColor" className="opacity-90 text-cyan-400" />;
        case "theme-corporate": return <Briefcase size={20} fill="currentColor" className="opacity-90 text-slate-800" />;
        default: return <Sun size={20} fill="currentColor" className="opacity-90" />;
    }
  };

  const getThemeStyles = () => {
    switch(theme) {
        case "light": return "bg-white/80 text-yellow-600 hover:shadow-lg border-black/10";
        case "dark": return "bg-black/40 text-indigo-400 border-white/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]";
        case "theme-cyberpunk": return "bg-purple-900/60 text-cyan-400 border-pink-500/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]";
        case "theme-corporate": return "bg-slate-200 text-blue-800 border-slate-300 hover:shadow-lg hover:border-blue-400";
        default: return "bg-white/80 text-yellow-600";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Label indicating current theme */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.8, x: 0 }}
        key={theme}
        className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/20 backdrop-blur text-white shadow-lg pointer-events-none"
      >
        {theme.replace('theme-', '')}
      </motion.div>
      
      <motion.button
        onClick={toggleTheme}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          backdrop-blur-md border shadow-2xl
          transition-colors duration-300
          ${getThemeStyles()}
        `}
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        aria-label="Toggle Advanced Theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            {currentIcon()}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
