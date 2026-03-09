import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { User, Info } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

/**
 * Navbar Component
 * Top navigation bar with user menu and logout
 * Shared across all protected pages
 */
export default function Navbar({ dark = true }) {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`px-6 py-4 flex justify-between items-center z-50 relative bg-[#0B0F14] border-b border-[#1e293b]`}
    >
      <div>
        {/* Logo is in Sidebar, but we can keep page title or breadcrumb here if needed */}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-6">
            {/* About Link */}
            <Link
              to="/about"
              className="group flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded-lg transition-all"
              title="About & Credits"
            >
              <Info size={16} className="text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity hidden sm:block">Credits</span>
            </Link>

            {/* Notification Center */}
            <NotificationCenter />

            <Link to="/profile" className="flex items-center gap-3 group px-2 py-1 rounded-lg hover:bg-gray-800/50 transition-all">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 bg-gray-600/20 flex items-center justify-center transition-all group-hover:border-blue-500 ring-0 group-hover:ring-4 ring-blue-500/10">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <User size={16} className="text-gray-400" />
                )}
              </div>
              <span className="text-sm hidden md:block text-gray-400 group-hover:text-blue-400 transition-colors">
                <span className="text-gray-400 mr-1 font-bold">Welcome (MODIFIED),</span>
                <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                  {user.name || user.email.split('@')[0]}
                </span>
              </span>
            </Link>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </motion.nav>
  );
}
