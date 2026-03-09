// server/routes/taskRoutes.js
import express from "express";
import Task from "../models/Task.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  createTask,
  changeTaskStatus,
  updateTask,
  updateTaskDependencies,
  getTaskDependencyTree,
  completeTask,
  getTaskRiskAssessment,
  updateTaskRisk,
  getSuggestedAssignees,
  getFrictionTasks,
  getReassignmentHistory,
} from "../controllers/taskController.js";

const router = express.Router();

// If MongoDB is not configured, short-circuit these routes with a clear response
if (!process.env.MONGO_URI) {
  router.use((req, res) =>
    res.status(501).json({
      message:
        'MongoDB is not configured. Task routes using MongoDB are disabled. Use Firestore-backed endpoints or set MONGO_URI.',
    })
  );
}

const getAssigneeId = (task) =>
  task.assignee?._id?.toString?.() || task.assignee?.toString?.() || null;

/* -------------------------------
   ✅ GET ALL TASKS
---------------------------------- */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { assignee, status, project } = req.query;
    const q = {};
    if (assignee) q.assignee = assignee;
    if (status) q.status = status;
    if (project) q.project = project;

    const tasks = await Task.find(q)
      .populate("createdBy", "name email")
      .populate("assignee", "name email")
      .populate("project", "name");

    res.json({ tasks });
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
   ✅ CREATE TASK (Owner/Admin)
---------------------------------- */
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only owners can create tasks" });
    }

    const { title, description, priority, assignee, project } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });

    const newTask = await Task.create({
      title,
      description: description || "",
      priority: priority || "medium",
      status: "todo",
      assignee: assignee || null,
      project: project || null,
      createdBy: req.user.id,
    });

    const populated = await Task.findById(newTask._id)
      .populate("createdBy", "name email")
      .populate("assignee", "name email")
      .populate("project", "name");

    res.status(201).json({ task: populated });
  } catch (err) {
    console.error("❌ Error creating task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
   ✅ UPDATE TASK
   - Only assigned member can update status
   - Owner/Admin can edit metadata
---------------------------------- */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignee", "name email")
      .populate("project", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const userId = req.user.id;
    const assigneeId = getAssigneeId(task);
    const isAssignedMember = assigneeId === userId;
    const isOwnerOrAdmin = ["owner", "admin"].includes(req.user.role);

    if (req.body.status !== undefined) {
      if (!isAssignedMember)
        return res.status(403).json({ message: "Only assigned member can update task status" });
      task.status = req.body.status;
    } else if (isOwnerOrAdmin) {
      Object.assign(task, req.body);
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate("createdBy", "name email")
      .populate("assignee", "name email")
      .populate("project", "name");

    res.json({ success: true, task: updated });
  } catch (err) {
    console.error("❌ Error updating task:", err);
    res.status(500).json({ message: "Server error updating task" });
  }
});

/* -------------------------------
   ✅ DELETE TASK (Owner/Admin)
---------------------------------- */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!["owner", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only owners can delete tasks" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
   ✅ SUBTASKS
---------------------------------- */
// Create subtask (team member or owner)
router.post("/:id/subtasks", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const userId = req.user.id;
    const assigneeId = getAssigneeId(task);
    const isAllowed =
      ["owner", "admin"].includes(req.user.role) || assigneeId === userId || task.createdBy.toString() === userId;
    if (!isAllowed) return res.status(403).json({ message: "Forbidden" });

    task.subtasks.push({
      title,
      description: description || "",
      createdBy: userId,
    });
    await task.save();

    const updated = await Task.findById(task._id)
      .populate("createdBy", "name email")
      .populate("assignee", "name email");

    res.status(201).json({ success: true, task: updated });
  } catch (err) {
    console.error("❌ Error creating subtask:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update subtask status
router.put("/:id/subtasks/:subId", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const sub = task.subtasks.id(req.params.subId);
    if (!sub) return res.status(404).json({ message: "Subtask not found" });

    const userId = req.user.id;
    const assigneeId = getAssigneeId(task);
    const isAllowed =
      ["owner", "admin"].includes(req.user.role) ||
      assigneeId === userId ||
      sub.createdBy.toString() === userId;

    if (!isAllowed) return res.status(403).json({ message: "Forbidden" });

    if (status) sub.status = status;
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    console.error("❌ Error updating subtask:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


// ============================================
// FIRESTORE-BASED TASK ROUTES
// ============================================

// Create task (Firestore)
router.post("/firestore/create", verifyToken, createTask);

// Change task status (Firestore)
router.put("/firestore/:taskId/status", verifyToken, changeTaskStatus);

// Dependency Management Routes
router.put("/firestore/:taskId/dependencies", verifyToken, updateTaskDependencies);
router.get("/firestore/:taskId/dependency-tree", verifyToken, getTaskDependencyTree);
router.post("/firestore/:taskId/complete", verifyToken, completeTask);


// Risk Assessment Routes
router.get("/firestore/:taskId/risk-assessment", verifyToken, getTaskRiskAssessment);
router.put("/firestore/:taskId/update-risk", verifyToken, updateTaskRisk);


// Skill matching route
router.get("/firestore/:taskId/suggested-assignees", verifyToken, getSuggestedAssignees);

// Update task (Firestore) - includes reassignment tracking
router.put("/firestore/:taskId", verifyToken, updateTask);

// Friction tracking routes
router.get("/firestore/:taskId/reassignment-history", verifyToken, getReassignmentHistory);
