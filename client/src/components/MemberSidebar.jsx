import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Users,
  LogOut,
  Bug,
  Target,
  TrendingUp,
  FileText,
  BarChart2,
  MessageCircle,
  Bot,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MemberSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { key: 'dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={18} />, path: '/member/dashboard' },
    { key: 'team', label: 'Team Overview', icon: <Users size={18} />, path: '/member/team' },
    { key: 'deadlines', label: 'Deadlines', icon: <Clock size={18} />, path: '/member/deadlines' },
    { key: 'performance', label: 'Performance', icon: <BarChart2 size={18} />, path: '/member/performance' },
    { key: 'my-tasks', label: 'My Tasks', icon: <CheckSquare size={18} />, path: '/member/tasks' },
    { key: 'bugs', label: 'Bug Reports', icon: <Bug size={18} />, path: '/member/bugs' },
    { key: 'documents', label: 'Documents', icon: <FileText size={18} />, path: '/member/documents' },
    { key: 'chat', label: 'Team Chat', icon: <MessageCircle size={18} />, path: '/member/chat' },
    { key: 'ai', label: 'AI Assistant', icon: <Bot size={18} />, path: '/member/ai-assistant' },
    { key: 'profile', label: 'My Profile', icon: <User size={18} />, path: '/profile' },
  ];

  return (
    <aside className="h-screen w-64 bg-[var(--card-bg)]/80 backdrop-blur-md text-[var(--text-primary)] fixed left-0 top-0 border-r border-[var(--border-color)] shadow-xl z-50 transition-colors duration-300">
      <Link to="/profile" className="px-6 py-6 border-b border-[var(--border-color)] flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/50 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform bg-[var(--bg-secondary)]">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-indigo-400" />
          )}
        </div>
        <div className="overflow-hidden">
          <h2 className="text-lg font-bold tracking-tight group-hover:text-blue-400 transition-colors truncate text-[var(--text-primary)]">TaskHive</h2>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide group-hover:text-blue-300">MEMBER PANEL</p>
        </div>
      </Link>

      <nav className="p-4 space-y-1 overflow-auto" style={{ height: 'calc(100vh - 140px)' }}>
        {menu.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group ${active
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 shadow-md shadow-blue-900/10'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              <div className={`transition-colors ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                {item.icon}
              </div>
              <span className={`text-sm font-medium ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                {item.label}
              </span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-transparent border-t border-[var(--border-color)]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-95 group"
        >
          <LogOut size={18} className="group-hover:text-red-400" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}