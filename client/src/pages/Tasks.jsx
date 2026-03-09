// client/src/pages/Tasks.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import ParticleBackground from "../components/ParticleBackground";
import { API_BASE_URL } from "../config";
import { motion } from "framer-motion";

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

export default function Tasks() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignee: "", project: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setProjects(data.projects || []);
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
    fetchTasks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) return setError("Title required");
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setTasks((p) => [data.task, ...p]);
      setForm({ title: "", description: "", priority: "medium", assignee: "", project: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
    } catch (err) { console.error(err); }
  };

  const assignTask = async (id, assigneeId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignee: assigneeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Assign failed");
      setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete task?")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem("devsync_auth");
    window.location.href = "/login";
  };

  return (
    <div className="flex bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen transition-colors duration-300 relative">
      <ParticleBackground />
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1">
        <Topbar title="Tasks" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} className="col-span-1">
            <div className="bg-[var(--card-bg)] p-4 rounded-lg shadow-lg border border-[var(--border-color)]">
              <h3 className="font-semibold mb-2">Create Task</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <input className="input w-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <textarea className="input w-full" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <select className="input w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                {/* ✅ New project dropdown */}
                <select className="input w-full" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>

                <select className="input w-full" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>

                {error && <div className="text-red-400 text-sm">{error}</div>}
                <button className="btn-primary w-full">Create</button>
              </form>
            </div>
          </motion.div>

          <div className="col-span-2">
            <div className="bg-[var(--card-bg)] p-4 rounded-lg shadow-lg border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">All Tasks</h3>
                <div className="text-sm text-[var(--text-secondary)]">{loading ? "Loading…" : `${tasks.length} tasks`}</div>
              </div>

              <div className="space-y-3">
                {tasks.map((t) => (
                  <div key={t._id} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-[var(--muted)] border border-[var(--border-color)]">{t.priority}</div>
                        <div className="text-xs text-[var(--text-secondary)]">#{t._id.slice(-4)}</div>
                      </div>
                      <div className="text-sm text-[var(--muted)] mt-1">{t.description}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-2">
                        Created by: {t.createdBy?.name || "Unknown"} • Assigned to: {t.assignee?.name || "Unassigned"} • Project:{" "}
                        {t.project?.name || "None"}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <select className="input mb-1" value={t.status} onChange={(e) => updateStatus(t._id, e.target.value)}>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <select className="input" value={t.assignee?._id || ""} onChange={(e) => assignTask(t._id, e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                      <button className="px-3 py-1 bg-red-600 rounded text-white text-sm" onClick={() => deleteTask(t._id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <div className="text-[var(--text-secondary)]">No tasks yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
