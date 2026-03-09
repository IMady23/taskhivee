// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import { API_BASE_URL } from "../config";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import ParticleBackground from "../components/ParticleBackground";

function getAuthToken() {
  const raw = localStorage.getItem("devsync_auth");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.token || parsed?.token;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const COLORS = ["#4ade80", "#facc15", "#f87171"];

  const fetchData = async () => {
    const token = getAuthToken();
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [projData, taskData] = await Promise.all([projRes.json(), taskRes.json()]);
      if (projRes.ok) setProjects(projData.projects || []);
      if (taskRes.ok) setTasks(taskData.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    inprogress: tasks.filter((t) => t.status === "inprogress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const chartData = [
    { name: "To Do", value: statusCounts.todo },
    { name: "In Progress", value: statusCounts.inprogress },
    { name: "Done", value: statusCounts.done },
  ];

  const handleLogout = () => {
    localStorage.removeItem("devsync_auth");
    window.location.href = "/login";
  };

  return (
    <div className="flex bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen transition-colors duration-300 relative">
      <ParticleBackground />
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1">
        <Topbar title="Dashboard" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] p-4 rounded-lg shadow-lg border border-[var(--border-color)]">
            <h3 className="font-semibold mb-2">Project Count</h3>
            <div className="text-3xl font-bold">{projects.length}</div>
          </div>

          <div className="bg-[var(--card-bg)] p-4 rounded-lg shadow-lg border border-[var(--border-color)]">
            <h3 className="font-semibold mb-2">Task Overview</h3>
            <PieChart width={400} height={250}>
              <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
}
