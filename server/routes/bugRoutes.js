import express from "express";
import { createBug, getBugs, updateBugStatus, deleteBug } from "../controllers/bugController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBug); // Create bug
router.get("/:teamId", protect, getBugs); // Get bugs (filtered by role inside controller)
router.patch("/:bugId/status", protect, updateBugStatus); // Update status (Leader only)
router.delete("/:bugId", protect, deleteBug); // Delete bug (Leader only)

export default router;
