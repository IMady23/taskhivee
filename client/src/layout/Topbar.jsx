// client/src/layout/Topbar.jsx
import React from "react";
import { LogOut, Bell, User } from "lucide-react";
import { Link } from "react-router-dom";
import { handleLogout } from "../utils/logout"; // existing util

export default function Topbar({ user, title }) {
  // fallback: try localStorage if user prop isn't passed
  let email = user?.email;
  if (!email) {
    try {
      const auth = JSON.parse(localStorage.getItem("devsync_auth") || "null");
      email = auth?.user?.email || auth?.user?.email;
    } catch (e) {
      email = "";
    }
  }

  return (
    <div className="flex justify-between items-center px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gradient">{title || "Dashboard"}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="hover:text-blue-400 transition" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">Welcome,</span>
          <Link to="/profile" className="flex items-center gap-2 group px-2 py-1 rounded-lg hover:bg-gray-800/50 transition-all">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-600/20 flex items-center justify-center transition-all group-hover:border-blue-500">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-blue-400 uppercase">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </span>
              )}
            </div>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm transition"
          title="Logout"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div >
  );
}
