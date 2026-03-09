import React, { useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, List, Clock, Bug, Calendar, MessageCircle, BarChart, Users, Settings, LogOut, CheckSquare, AlertCircle, FileText, Bot, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function LeaderSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const menu = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home size={18} />, path: '/leader/dashboard' },
    { key: 'team', label: 'Team Management', icon: <Users size={18} />, path: '/leader/team' },
    { key: 'tasks', label: 'Task Management', icon: <CheckSquare size={18} />, path: '/leader/tasks' },
    { key: 'bugs', label: 'Bug Tracker', icon: <Bug size={18} />, path: '/leader/bugs' },
    { key: 'deadlines', label: 'Deadlines', icon: <Calendar size={18} />, path: '/leader/deadlines' },
    { key: 'performance', label: 'Team Performance', icon: <BarChart size={18} />, path: '/leader/performance' },
    { key: 'documents', label: 'Documents', icon: <FileText size={18} />, path: '/leader/documents' },
    { key: 'chat', label: 'Team Chat', icon: <MessageCircle size={18} />, path: '/leader/chat' },
    { key: 'ai', label: 'AI Assistant', icon: <Bot size={18} />, path: '/leader/ai-assistant' }, // Shared route
    { key: 'profile', label: 'Profile', icon: <User size={18} />, path: '/profile' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="h-screen w-64 bg-[var(--card-bg)]/80 backdrop-blur-md text-[var(--text-primary)] fixed left-0 top-0 border-r border-[var(--border-color)] shadow-xl z-50 transition-colors duration-300">
      <Link to="/profile" className="px-6 py-5 border-b border-[var(--border-color)] flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-all cursor-pointer group">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/50 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform bg-[var(--bg-secondary)]">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-blue-400" />
          )}
        </div>
        <div className="overflow-hidden">
          <h2 className="text-lg font-bold group-hover:text-blue-400 transition-colors truncate text-[var(--text-primary)]">
            TaskHive
          </h2>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1 group-hover:text-blue-300 uppercase tracking-widest">Leader Panel</p>
        </div>
      </Link>

      <nav className="px-2 py-4 overflow-auto" style={{ height: 'calc(100vh - 200px)' }}>
        {menu.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md mb-1 transition-colors ${active ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}

        {/* Quick Access Info Removed - Items moved to main menu */}
      </nav>

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
