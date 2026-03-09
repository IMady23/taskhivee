// client/src/layout/Sidebar.jsx
import React, { useState } from "react";
import { Home, Users, BarChart2, List, Settings, Box, User } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: "Dashboard", icon: <Home size={20} />, route: "/dashboard" },
    { name: "Projects", icon: <Box size={20} />, route: "/projects" }, // ← added
    { name: "Tasks", icon: <List size={20} />, route: "/tasks" },
    { name: "Team", icon: <Users size={20} />, route: "/workspace" },
    { name: "Reports", icon: <BarChart2 size={20} />, route: "/dashboard" },
    { name: "Settings", icon: <Settings size={20} />, route: "/settings" },
    { name: "Profile", icon: <User size={20} />, route: "/profile" },
  ];

  return (
    <div
      className={`h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] border-r border-[var(--border-color)] transition-all duration-300 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      <Link to="/profile" className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition group cursor-pointer">
        <h1
          className={`font-bold text-xl text-gradient group-hover:opacity-80 transition ${collapsed ? "hidden" : "block"}`}
        >
          TaskHive
        </h1>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </Link>

      <div className="mt-6 flex flex-col gap-1 px-2">
        {menu.map((item, i) => {
          const active = location.pathname === item.route;
          return (
            <button
              key={i}
              onClick={() => navigate(item.route)}
              className={`sidebar-btn flex items-center gap-3 px-3 py-2 rounded ${active ? "bg-[var(--accent-primary)] text-white" : "hover:bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>
    </div >
  );
}
