import express from "express";
import {
  updateMemberSkills,
  getMemberSkills,
  getValidSkills,
} from "../controllers/memberController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Skill management routes
router.get("/valid-skills", verifyToken, getValidSkills);
router.get("/:memberId/skills", verifyToken, getMemberSkills);
router.put("/:memberId/skills", verifyToken, updateMemberSkills);

export default router;
