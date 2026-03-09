import express from "express";
import {
  createTeam,
  getTeamWorkload,
  getMemberWorkload,
  getTeamHealthScore,
  getTeamHealthHistory,
  getActivityTimeline,
  getActivityFilters,
  generateWeeklySummary,
  getTeamSummaries,
} from "../controllers/teamController.js";
import { getAtRiskTasks, getFrictionTasks } from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // Assuming this exists

const router = express.Router();

// Protected routes (require login)
router.post("/create", verifyToken, createTeam);

export default router;


// Workload endpoints
router.get("/:teamId/workload", verifyToken, getTeamWorkload);
router.get("/:teamId/workload/:memberId", verifyToken, getMemberWorkload);


// Risk assessment endpoint
router.get("/:teamId/at-risk-tasks", verifyToken, getAtRiskTasks);


// Health score endpoints
router.get("/:teamId/health-score", verifyToken, getTeamHealthScore);
router.get("/:teamId/health-history", verifyToken, getTeamHealthHistory);


// Activity timeline endpoints
router.get("/:teamId/activity-timeline", verifyToken, getActivityTimeline);
router.get("/:teamId/activity-timeline/filters", verifyToken, getActivityFilters);


// AI Summary endpoints
router.post("/:teamId/generate-summary", verifyToken, generateWeeklySummary);
router.get("/:teamId/summaries", verifyToken, getTeamSummaries);

// Friction tracking endpoint
router.get("/:teamId/friction-tasks", verifyToken, getFrictionTasks);
