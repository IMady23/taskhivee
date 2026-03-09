import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeaderSidebar from '../components/LeaderSidebar';
import Navbar from '../components/Navbar';
import { BugsProvider } from '../context/BugsContext';
import { TasksProvider } from '../context/TasksContext';
import { TeamProvider } from '../context/TeamContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-300">
      <LeaderSidebar />

      <div className="flex-1 ml-64 relative z-10 transition-colors duration-300 flex flex-col">
        {/* Navbar with logout button */}
        <Navbar />

        {/* Main content with context providers and transitions */}
        <div className="flex-1 overflow-auto bg-[#0B0F14]/20 relative">
          <TeamProvider>
            <TasksProvider>
              <BugsProvider>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="p-6 md:p-8 min-h-full"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </BugsProvider>
            </TasksProvider>
          </TeamProvider>
        </div>
      </div>
    </div>
  );
}
