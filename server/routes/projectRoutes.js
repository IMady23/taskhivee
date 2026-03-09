// server/routes/projectRoutes.js
import express from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getIO } from "../socket.js"; // ✅ for realtime updates

const router = express.Router();

// If MongoDB is not configured, short-circuit these routes with a clear response
if (!process.env.MONGO_URI) {
  router.use((req, res) =>
    res.status(501).json({
      message:
        'MongoDB is not configured. Project routes using MongoDB are disabled. Use Firestore-backed endpoints or set MONGO_URI.',
    })
  );
}

// 🟩 Get all projects for user
router.get("/", verifyToken, async (req, res) => {
  if (!process.env.MONGO_URI) {
    return res.status(501).json({
      message:
        'MongoDB is not configured. Project routes using MongoDB are disabled. Use Firestore-backed endpoints or set MONGO_URI.',
    });
  }
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let projects;
    if (userRole === "owner" || userRole === "admin") {
      projects = await Project.find({ owner: userId })
        .populate("members", "name email role")
        .populate("owner", "name email");
    } else {
      projects = await Project.find({ members: userId })
        .populate("members", "name email role")
        .populate("owner", "name email");
    }

    res.json({ projects });
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟩 Create new project
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user.id,
      members,
    });

    const populated = await Project.findById(project._id)
      .populate("members", "name email")
      .populate("owner", "name email");

    // ✅ Emit event
    const io = getIO();
    io.emit("project:created", { project: populated });

    res.status(201).json({ project: populated });
  } catch (err) {
    console.error("❌ Error creating project:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟩 Get single project with tasks and progress
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members", "name email")
      .populate("owner", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only project owner or members can view
    if (
      project.owner._id.toString() !== req.user.id &&
      !project.members.some((m) => m._id.toString() === req.user.id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tasks = await Task.find({ project: project._id })
      .populate("createdBy", "name email")
      .populate("assignee", "name email");

    const progress = {
      todo: tasks.filter((t) => t.status === "todo").length,
      inprogress: tasks.filter((t) => t.status === "inprogress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    const total = tasks.length;
    progress.completionRate = total
      ? Math.round((progress.done / total) * 100)
      : 0;

    res.json({ project, tasks, progress });
  } catch (err) {
    console.error("❌ Error fetching project details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟩 Delete project
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    // ✅ Emit delete event
    const io = getIO();
    io.emit("project:deleted", { projectId: req.params.id });

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
