// Projects.jsx - Firebase/Firestore version (no backend required)
import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import ParticleBackground from "../components/ParticleBackground";
import { motion } from "framer-motion";
import { Box } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const { user } = useContext(AuthContext);

  const isOwner = user?.role === "leader" || user?.role === "owner" || user?.role === "admin";

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const createProject = async (e) => {
    e.preventDefault();
    if (!form.name) return alert("Project name is required!");

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: form.name,
        description: form.description,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        members: [user.uid], // Add creator as member
      });

      const newProject = {
        id: docRef.id,
        name: form.name,
        description: form.description,
        createdBy: user.uid,
        members: [user.uid],
      };

      setProjects((prev) => [newProject, ...prev]);
      setForm({ name: "", description: "" });
      setShowCreate(false);
      alert("✅ Project created successfully!");
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Failed to create project");
    }
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete project?")) return;

    try {
      await deleteDoc(doc(db, "projects", id));
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project");
    }
  };

  return (
    <div className="flex bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen transition-colors duration-300 relative">
      <ParticleBackground />
      <Sidebar />
      <div className="flex-1">
        <Topbar title="Projects" />
        <div className="p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl text-indigo-300 font-semibold">Projects</h2>
            {isOwner ? (
              <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Project</button>
            ) : (
              <div className="text-sm text-[var(--text-secondary)]">Viewing assigned projects</div>
            )}
          </div>
          {loading && <p>Loading...</p>}
          {!loading && projects.length === 0 && (
            <div className="text-center bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-lg">
              <Box className="mx-auto text-indigo-400" />
              <p>No projects yet</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <motion.div key={p.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-lg shadow">
                <h4 className="text-lg font-semibold">{p.name}</h4>
                <p className="text-sm text-[var(--text-secondary)]">{p.description}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">Members: {p.members?.length || 0}</p>
                <div className="flex justify-between mt-3">
                  <a href={`/projects/${p.id}`} className="text-indigo-400 underline">Open</a>
                  {isOwner && <button className="text-red-400" onClick={() => deleteProject(p.id)}>Delete</button>}
                </div>
              </motion.div>
            ))}
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
              <div className="bg-[var(--bg-secondary)] p-6 rounded-lg w-full max-w-md relative border border-[var(--border-color)]">
                <form onSubmit={createProject} className="space-y-3">
                  <input
                    className="input w-full"
                    placeholder="Project name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <textarea
                    className="input w-full"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <label className="text-sm text-[var(--text-secondary)]">Add Members</label>
                  <select
                    className="input w-full"
                    value={form.members}
                    onChange={(e) =>
                      setForm({ ...form, members: [...e.target.selectedOptions].map((o) => o.value) })
                    }
                  >
                    <option value="">No additional members for now</option>
                  </select>
                  <div className="flex justify-end mt-3 gap-3">
                    <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-600 px-3 py-1 rounded">Cancel</button>
                    <button type="submit" className="btn-primary">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
