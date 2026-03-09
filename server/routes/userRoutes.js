// server/routes/userRoutes.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// list users (protected)
router.get("/", verifyToken, async (req, res) => {
  // If MongoDB is not configured, return a clear 501 response
  if (!process.env.MONGO_URI) {
    return res.status(501).json({
      message:
        'MongoDB is not configured. User listing via MongoDB is disabled. Use Firestore endpoints or configure MONGO_URI.',
    });
  }
  try {
    const users = await User.find({}, "name email role").sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
