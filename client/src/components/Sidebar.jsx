import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, BarChart2, List, Settings, Box, User, Coffee, FileText, UserPlus, MessageCircle, Bug, Calendar } from "lucide-react";
import { AuthContext } from '../context/AuthContext';

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 * Shared across all protected pages
 */
export default function Sidebar({ role = 'member' }) {
  const { user } = React.useContext(AuthContext);
  const location = useLocation();

  const leaderMenuItems = [
    { label: 'Dashboard', path: '/leader/dashboard', icon: <Home size={18} /> },
    { label: 'Team', path: '/leader/team', icon: <Users size={18} /> },
    { label: 'Tasks', path: '/leader/tasks', icon: <List size={18} /> },
    { label: 'Documents', path: '/leader/documents', icon: <FileText size={18} /> },
    { label: 'Whiteboard', path: '/leader/whiteboard', icon: <Box size={18} /> },
    { label: 'Bug Tracker', path: '/leader/bugs', icon: <Bug size={18} /> },
    { label: 'Deadlines', path: '/leader/deadlines', icon: <Calendar size={18} /> },
    { label: 'Team Chat', path: '/leader/chat', icon: <MessageCircle size={18} /> },
    { label: 'Performance', path: '/leader/performance', icon: <BarChart2 size={18} /> },
    { label: 'AI Assistant', path: '/leader/ai-assistant', icon: <Box size={18} /> },
    { label: 'Dev Tools', path: '/leader/dev-tools', icon: <Settings size={18} /> },
    { label: 'Relax', path: '/relax', icon: <Coffee size={18} /> },
  ];

  const memberMenuItems = [
    { label: 'Dashboard', path: '/member/dashboard', icon: <Home size={18} /> },
    { label: 'My Tasks', path: '/member/tasks', icon: <List size={18} /> },
    { label: 'Documents', path: '/member/documents', icon: <FileText size={18} /> },
    { label: 'Whiteboard', path: '/member/whiteboard', icon: <Box size={18} /> },
    { label: 'Bug Reports', path: '/member/bugs', icon: <Box size={18} /> },
    { label: 'Deadlines', path: '/member/deadlines', icon: <Calendar size={18} /> },
    { label: 'Team Chat', path: '/member/chat', icon: <MessageCircle size={18} /> },
    { label: 'AI Assistant', path: '/member/ai-assistant', icon: <Box size={18} /> },
    { label: 'Transition', path: '/member/transition', icon: <UserPlus size={18} /> },
    { label: 'Dev Tools', path: '/member/dev-tools', icon: <Settings size={18} /> },
    { label: 'Relax', path: '/relax', icon: <Coffee size={18} /> },
  ];

  const menuItems = role === 'leader' ? leaderMenuItems : memberMenuItems;

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "circOut" }}
      className="w-64 bg-black/40 backdrop-blur-2xl text-[var(--text-primary)] h-screen border-r border-white/10 fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <Link
        to="/profile"
        className="p-8 border-b border-white/5 flex flex-col gap-4 hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 bg-gradient-to-br from-blue-900/40 to-black/40">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-blue-400" />
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-blue-400 transition-colors truncate">
              TaskHive
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-bold">
                {role} System
              </p>
            </div>
          </div>
        </div>
      </Link>

      <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative
                ${isActive
                  ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] border border-blue-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] border border-transparent'
                }
              `}
            >
              <div className={`
                transition-transform duration-300 group-hover:scale-110 
                ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-white/50 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'}
              `}>
                {item.icon}
              </div>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 text-[10px] text-white/50 font-bold tracking-widest uppercase">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
          System Online
        </div>
      </div>
    </motion.div>
  );
}
