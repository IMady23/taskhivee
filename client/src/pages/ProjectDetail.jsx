// client/src/pages/ProjectDetail.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import ParticleBackground from "../components/ParticleBackground";
import { API_BASE_URL } from "../config";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("devsync_auth"));
  } catch {
    return null;
  }
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const token = auth?.token;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ todo: 0, inprogress: 0, done: 0, completionRate: 0 });
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [subtaskForms, setSubtaskForms] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProject(data.project);
      setTasks(data.tasks);
      setProgress(data.progress);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // ✅ Create main task (Owner/Admin only)
  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Task title required!");
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, project: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm({ title: "", description: "", priority: "medium" });
      fetchProject();
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Update main task status (team member)
  const updateTaskStatus = async (taskId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchProject();
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Create subtask
  const createSubtask = async (taskId, e) => {
    e.preventDefault();
    const subForm = subtaskForms[taskId];
    if (!subForm?.title) return alert("Subtask title required");
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(subForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubtaskForms((f) => ({ ...f, [taskId]: { title: "", description: "" } }));
      fetchProject();
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Update subtask status
  const updateSubtaskStatus = async (taskId, subId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchProject();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center text-white p-6">Loading...</div>;

  return (
    <div className="flex bg-[#1e1e1e] text-white min-h-screen relative">
      <ParticleBackground />
      <Sidebar />
      <div className="flex-1">
        <Topbar title={project?.name || "Project"} />
        <div className="p-6">
          <button onClick={() => navigate("/projects")} className="text-indigo-400 flex items-center mb-4">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>

          {/* Project Info */}
          <div className="bg-[#252526] p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold">{project?.name}</h2>
            <p className="text-gray-400">{project?.description}</p>
          </div>

          {/* Tasks */}
          <div className="bg-[#252526] p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Tasks</h3>
            {tasks.map((t) => (
              <div key={t._id} className="mb-4 bg-[#1b1b1b] p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-sm text-gray-400">{t.description}</div>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => updateTaskStatus(t._id, e.target.value)}
                    className="input text-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Subtasks */}
                {t.subtasks?.length > 0 && (
                  <div className="mt-3 border-t border-gray-600 pt-2">
                    <h4 className="text-sm text-gray-300 mb-2">Subtasks</h4>
                    {t.subtasks.map((s) => (
                      <div key={s._id} className="flex justify-between text-sm mb-1">
                        <span>{s.title}</span>
                        <select
                          value={s.status}
                          onChange={(e) => updateSubtaskStatus(t._id, s._id, e.target.value)}
                          className="bg-gray-800 rounded px-2 text-xs"
                        >
                          <option value="todo">To Do</option>
                          <option value="inprogress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create subtask (visible to assignee) */}
                <form
                  onSubmit={(e) => createSubtask(t._id, e)}
                  className="mt-3 flex gap-2 text-sm"
                >
                  <input
                    placeholder="New subtask"
                    value={subtaskForms[t._id]?.title || ""}
                    onChange={(e) =>
                      setSubtaskForms((f) => ({
                        ...f,
                        [t._id]: { ...f[t._id], title: e.target.value },
                      }))
                    }
                    className="input flex-1"
                  />
                  <button className="btn-primary px-3">+</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
