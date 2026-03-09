/**
 * Auth Routes
 * Endpoints:
 *   POST /register-leader - Register as leader
 *   POST /register-member - Register as member
 *   POST /verify-otp - Verify OTP and complete signup
 *   POST /resend-otp - Resend OTP
 *   POST /login - Login (any role)
 *   POST /logout - Logout
 *   GET /me - Get current user
 */
import express from "express";
import {
  registerLeader,
  registerMember,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getCurrentUser,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Register Leader
router.post("/register-leader", registerLeader);

// ✅ Register Member
router.post("/register-member", registerMember);

// ✅ Verify OTP
router.post("/verify-otp", verifyOTP);

// ✅ Resend OTP
router.post("/resend-otp", resendOTP);

// ✅ Login user
router.post("/login", login);

// ✅ Logout user
router.post("/logout", logout);

// ✅ Get current user (protected route)
router.get("/me", verifyToken, getCurrentUser);

export default router;
