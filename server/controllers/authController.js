/**
 * Auth Controller (Firebase Version)
 * Handles user registration and login using Firebase Authentication and Firestore
 */
import { auth } from "../config/firebase.js";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  markEmailVerified,
} from "../utils/firebaseService.js";
import { generateOTP, sendOTP, sendWelcomeEmail } from "../utils/emailService.js";

/**
 * Register a new leader
 * POST /api/auth/register-leader
 */
export const registerLeader = async (req, res) => {
  try {
    // Ensure Firebase Admin SDK is available
    if (!auth || typeof auth.createUser !== 'function') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK not configured on server. Please provide service account credentials in server/.env or drop server/config/serviceAccountKey.json',
      });
    }
    const { name, fullName, email, password, confirmPassword } = req.body;
    const displayName = name || fullName;

    // Validate input
    if (!displayName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields required (name, email, password, confirm password)" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Create Firebase Auth user
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName,
    });

    // Create user profile in Firestore
    await createUserProfile(firebaseUser.uid, {
      name: displayName,
      email,
      role: "leader",
      isEmailVerified: false,
    });

    // Generate OTP for email verification
    const otp = generateOTP();

    // Store OTP in Firestore (temporary field)
    await updateUserProfile(firebaseUser.uid, {
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send OTP email
    await sendOTP(email, otp, displayName);

    res.status(201).json({
      message: "Leader registered successfully. Check your email for OTP verification.",
      userId: firebaseUser.uid,
      email: firebaseUser.email,
      requiresOTP: true,
    });
  } catch (error) {
    console.error("❌ Register leader error:", { message: error.message, code: error.code, stack: error.stack });

    // Handle specific Firebase errors
    if (error.code === 'FIREBASE_ADMIN_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK is not configured on the server. Please provide service account credentials or drop server/config/serviceAccountKey.json',
      });
    }
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: "Email already registered" });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ message: "Invalid email address" });
    }

    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

/**
 * Register a new member
 * POST /api/auth/register-member
 */
export const registerMember = async (req, res) => {
  let firebaseUser = null;
  try {
    if (!auth || typeof auth.createUser !== 'function') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK not configured on server. Please provide service account credentials.',
      });
    }
    const { name, fullName, email, password, confirmPassword, teamCode } = req.body;
    console.log("DEBUG: registerMember body:", req.body); // DEBUG LOG
    const displayName = name || fullName;

    // Validate input
    if (!displayName || !email || !password || !confirmPassword || !teamCode) {
      return res.status(400).json({ message: "All fields required (name, email, password, team code)" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // STRICT VALIDATION: Check Team and Invitation
    console.log("DEBUG: Importing Firebase config...");
    const { db, admin } = await import("../config/firebase.js");
    const FieldValue = admin.firestore.FieldValue;

    console.log(`DEBUG: Querying team with code: ${teamCode}`);
    const teamsRef = db.collection('teams');
    const teamQuery = await teamsRef.where('teamId', '==', teamCode).get();

    if (teamQuery.empty) {
      console.log("DEBUG: Invalid Team Code");
      return res.status(400).json({ message: "Invalid Team Code" });
    }

    const teamDoc = teamQuery.docs[0];
    const teamData = teamDoc.data();
    const teamId = teamDoc.id;
    console.log("DEBUG: Team found:", teamId);

    // Check if user is in invitedMembers list strictly (Name + Email match)
    console.log("DEBUG: Checking invitation for:", { email, displayName });

    if (!teamData.invitedMembers || !Array.isArray(teamData.invitedMembers)) {
      console.log("DEBUG: No invitedMembers array found in team document.");
      return res.status(403).json({ message: "No pending invitations for this team." });
    }

    console.log("DEBUG: Current invitedMembers:", JSON.stringify(teamData.invitedMembers));

    const invitedEmail = email?.trim().toLowerCase().normalize('NFKC');
    console.log("DEBUG: Normalized registration email:", invitedEmail);
    
    const invitation = (teamData.invitedMembers || []).find((m) => {
      const memberEmail = m?.email?.trim().toLowerCase().normalize('NFKC');
      console.log(`DEBUG: Comparing invitation email "${memberEmail}" with "${invitedEmail}"`);
      return memberEmail === invitedEmail;
    });

    if (!invitation) {
      return res.status(403).json({
        message: "Registration denied. No pending invitation found for this email address."
      });
    }

    // Atomic-like Operation: Create Auth User -> Update Firestore -> Rollback if fail

    // 1. Create Firebase Auth user
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName,
      });
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: "Email already registered" });
      }
      throw authError;
    }

    // 2. Perform Firestore Updates (User Profile + Team Update)
    try {
      console.log("DEBUG: Starting Firestore batch operations...");
      const batch = db.batch();

      // Check if user profile already exists (re-invited user)
      const userRef = db.collection('users').doc(firebaseUser.uid);
      const existingUserDoc = await userRef.get();

      // CRITICAL: Always use invitation name, NEVER the signup name
      const finalName = invitation.name || displayName;
      console.log(`DEBUG: Using name from invitation: "${invitation.name}" (signup name was: "${displayName}")`);

      if (existingUserDoc.exists) {
        // CRITICAL FIX: Update existing user profile with NEW invitation name
        console.log(`DEBUG: Updating existing user ${firebaseUser.uid} with name: ${finalName}`);
        batch.update(userRef, {
          name: finalName, // Always use invitation name
          teamId: teamId,
          isEmailVerified: false,
          updatedAt: FieldValue.serverTimestamp()
        });

        // 🚀 NEW: Update Firebase Auth displayName via Admin SDK
        try {
          await auth.updateUser(firebaseUser.uid, { displayName: finalName });
          console.log(`[Server] Auth displayName updated to: ${finalName}`);
        } catch (authError) {
          console.error('[Server] Failed to update Auth displayName:', authError);
        }
      } else {
        // Create new user profile
        console.log(`DEBUG: Creating new user ${firebaseUser.uid} with name: ${finalName}`);
        batch.set(userRef, {
          name: finalName,
          email: email,
          role: "member",
          teamId: teamId,
          isEmailVerified: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      // Update Team: Add to members, Remove from invitedMembers (Filter method for robustness)
      const teamRef = db.collection('teams').doc(teamId);

      // Robust removal: Filter out the invitation by email with normalization
      const updatedInvitedMembers = (teamData.invitedMembers || []).filter(m => {
        const memberEmail = m.email?.trim().toLowerCase().normalize('NFKC');
        console.log(`DEBUG: Filtering - keeping "${memberEmail}"? ${memberEmail !== invitedEmail}`);
        return memberEmail !== invitedEmail;
      });

      console.log("DEBUG: Updating team document...");
      batch.update(teamRef, {
        members: FieldValue.arrayUnion(firebaseUser.uid),
        invitedMembers: updatedInvitedMembers, // Replace entire array with filtered one
        updatedAt: FieldValue.serverTimestamp()
      });

      // Commit batch
      console.log("DEBUG: Committing batch...");
      await batch.commit();
      console.log("DEBUG: Batch committed successfully!");

      // 🚀 FIX: Reliable leader notification (direct Firestore write)
      try {
        const leaderId = teamData.leaderId;
        if (leaderId) {
          console.log(`DEBUG: Creating notification for leader ${leaderId}...`);
          await db.collection('notifications').add({
            userId: leaderId,
            teamId: teamId,
            type: 'MEMBER_JOINED',
            title: 'Member Joined',
            message: `${finalName} has joined the team.`,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            metadata: { memberId: firebaseUser.uid }
          });
          console.log(`[Server] Notification created for leader ${leaderId}`);
        }
      } catch (notifError) {
        console.error('[Server] Failed to create notification:', notifError);
      }

      // CHAT SYSTEM MESSAGE: Member Joined
      try {
        console.log("DEBUG: Creating chat system message...");
        await db.collection('teamChats').add({
          teamId: teamId,
          senderId: 'SYSTEM',
          senderName: 'System',
          senderRole: 'system',
          type: 'system',
          message: `${finalName} has joined the team.`,
          createdAt: FieldValue.serverTimestamp()
        });
        console.log("DEBUG: Chat system message created!");
      } catch (chatError) {
        console.error("Failed to send system join message:", chatError);
      }

    } catch (firestoreError) {
      // ROLLBACK: Delete Auth user if Firestore fails
      console.error("❌ Firestore transaction failed:", firestoreError);
      console.error("❌ Error details:", {
        message: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack
      });
      try {
        await auth.deleteUser(firebaseUser.uid);
        console.log("✅ Rolled back Auth user");
      } catch (rollbackError) {
        console.error("❌ Failed to rollback Auth user:", rollbackError);
      }
      throw new Error(`Registration failed during database update: ${firestoreError.message}`);
    }

    // 3. Post-Process (OTP)
    const otp = generateOTP();
    await updateUserProfile(firebaseUser.uid, {
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(email, otp, displayName);

    res.status(201).json({
      message: "Member registered successfully. Check your email for OTP verification.",
      userId: firebaseUser.uid,
      email: firebaseUser.email,
      requiresOTP: true,
    });

  } catch (error) {
    console.error("❌ Register member error RAW:", error);
    console.error("❌ Register member error STACK:", error.stack);
    res.status(500).json({ message: `Registration failed: ${error.message}`, error: error.message });
  }
};

/**
 * Verify OTP and complete registration
 * POST /api/auth/verify-otp
 */
export const verifyOTP = async (req, res) => {
  try {
    if (!auth || typeof auth.getUser !== 'function') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK not configured on server. Please provide service account credentials in server/.env or drop server/config/serviceAccountKey.json',
      });
    }
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP required" });
    }

    // Get user profile from Firestore
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is correct and not expired
    if (userProfile.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > userProfile.otpExpiry?.toDate?.()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark email as verified and remove OTP
    await updateUserProfile(userId, {
      isEmailVerified: true,
      otp: null,
      otpExpiry: null,
    });

    // Send welcome email
    await sendWelcomeEmail(userProfile.email, userProfile.name, userProfile.role);

    // Get Firebase ID token for the user
    const firebaseUser = await auth.getUser(userId);

    // For testing purposes, create a custom token
    const customToken = await auth.createCustomToken(userId);

    res.status(200).json({
      message: "Email verified successfully",
      token: customToken,
      user: {
        uid: userId,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
      },
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", { message: error.message, code: error.code, stack: error.stack });
    if (error.code === 'FIREBASE_ADMIN_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK is not configured on the server. Please provide service account credentials or drop server/config/serviceAccountKey.json',
      });
    }
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userProfile.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update OTP in Firestore
    await updateUserProfile(userId, {
      otp,
      otpExpiry,
    });

    // Send OTP email
    await sendOTP(userProfile.email, otp, userProfile.name);

    res.status(200).json({
      message: "OTP sent to your email",
      email: userProfile.email,
    });
  } catch (error) {
    console.error("❌ Resend OTP error:", { message: error.message, code: error.code, stack: error.stack });
    if (error.code === 'FIREBASE_ADMIN_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK is not configured on the server. Please provide service account credentials or drop server/config/serviceAccountKey.json',
      });
    }
    res.status(500).json({ message: "Failed to resend OTP", error: error.message });
  }
};

/**
 * Login user (leader or member) - Returns Firebase ID Token
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!auth || typeof auth.getUserByEmail !== 'function') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK not configured on server. Please provide service account credentials in server/.env or drop server/config/serviceAccountKey.json',
      });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Get user by email
    let userProfile = null;
    try {
      const firebaseUser = await auth.getUserByEmail(email);
      userProfile = await getUserProfile(firebaseUser.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      throw error;
    }

    if (!userProfile) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!userProfile.isEmailVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
        userId: userProfile.uid,
        requiresOTP: true,
      });
    }

    // Note: Firebase Admin SDK cannot verify passwords directly
    // Password verification happens on the frontend with Firebase SDK
    // This endpoint is mainly for server-side operations
    // For full implementation, consider using Firebase REST API or moving password check to frontend

    const firebaseUser = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    res.status(200).json({
      message: "Login successful",
      token: customToken,
      user: {
        uid: firebaseUser.uid,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", { message: error.message, code: error.code, stack: error.stack });
    if (error.code === 'FIREBASE_ADMIN_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'Firebase Admin SDK is not configured on the server. Please provide service account credentials or drop server/config/serviceAccountKey.json',
      });
    }
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/**
 * Get authenticated user's profile
 * GET /api/auth/me
 * Requires Firebase ID token in Authorization header
 */
export const getCurrentUser = async (req, res) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User data retrieved",
      user: {
        uid,
        ...userProfile,
      },
    });
  } catch (error) {
    console.error("❌ Get current user error:", error.message);
    res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Logout happens on the frontend (token removal)
    // Server-side: revoke refresh tokens if needed
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("❌ Logout error:", error.message);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};
