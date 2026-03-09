/**
 * Auth Middleware (Firebase Version)
 * Verifies Firebase ID token and attaches user info to request
 * Also provides role-based authorization checks
 */
import { auth, db } from "../config/firebase.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. Token missing or malformed." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user data to request
    // Attach user data to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      iat: decodedToken.iat,
    };

    // Fetch full profile from Firestore to get name and role
    // This is required because Firebase Auth token doesn't always have display name up to date
    // or custom claims might not be set for role
    // Fetch full profile from Firestore to get name and role
    try {
      // Use top-level db import
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        req.user.name = userData.name || decodedToken.name;
        req.user.role = userData.role;
        req.user.teamId = userData.teamId;
        // console.log(`[AUTH] Enriched user: ${req.user.uid} -> Role: ${req.user.role}, Name: ${req.user.name}`);
      } else {
        console.warn(`[AUTH] User profile not found for UID: ${decodedToken.uid}`);
      }
    } catch (dbError) {
      console.error("[AUTH] Failed to fetch user profile:", dbError);
    }

    next();
  } catch (error) {
    console.error("❌ Firebase token verification failed:", error.message);
    // If Firebase Admin isn't configured, return 503 with actionable message
    if (error && error.code === 'FIREBASE_ADMIN_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK not configured on server. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in server/.env or provide server/config/serviceAccountKey.json',
      });
    }
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Alias for compatibility
export const authMiddleware = verifyToken;
export const protect = verifyToken;

/**
 * Role-based authorization middleware
 * Usage: router.post('/route', verifyToken, requireRole('leader'), controller)
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Import Firestore service to get user role
      const { getUserProfile } = await import("../utils/firebaseService.js");
      const userProfile = await getUserProfile(req.user.uid);

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userProfile.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${roles.join(", ")}`,
        });
      }

      // Attach role to request for use in controllers
      req.user.role = userProfile.role;
      next();
    } catch (error) {
      console.error("❌ Role verification error:", error.message);
      return res.status(403).json({ message: "Failed to verify user role" });
    }
  };
};

/**
 * Check if user is a leader
 */
export const isLeader = requireRole("leader");

/**
 * Check if user is a member
 */
export const isMember = requireRole("member");
