import { db, admin } from "../config/firebase.js";
import { createNotification } from "./notificationController.js";
import fs from 'fs';

const logFile = 'bug_debug.log';
console.log("--- BUG CONTROLLER LOADED ---");
const log = (msg) => {
  try {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(logFile, logMsg);
  } catch (e) {
    console.error("Logging failed", e);
  }
};

// Helper to normalize bug data
const normalizeBug = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    description: data.description || '',
    severity: data.severity || 'Medium',
    status: data.status || 'Open',
    teamId: data.teamId,
    relatedTaskId: data.relatedTaskId || null,
    reportedById: data.reportedById || null,
    reportedByName: data.reportedByName || 'Unknown',
    createdAt: data.createdAt, // Keep generic for frontend to handle, or convert if needed
  };
};

// Create a new bug (Member or Leader)
export const createBug = async (req, res) => {
  try {
    const { title, description, severity, relatedTaskId, teamId } = req.body;
    const { uid, name, email } = req.user; // from auth middleware

    log(`[createBug] Started. Team: ${teamId}, User: ${uid}`);

    // Ensure strict fields
    if (!title || !description || !severity || !teamId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newBug = {
      title,
      description,
      severity, // Low, Medium, High
      status: "Open", // Default
      teamId,
      relatedTaskId: relatedTaskId || null,
      reportedById: uid,
      reportedByName: name || 'Team Member', // Fallback if name missing
      reportedByEmail: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp() // Use Server Timestamp
    };



    log(`[createBug] Object created. Adding to Firestore...`);
    const docRef = await db.collection("bugs").add(newBug);
    log(`[createBug] Bug added with ID: ${docRef.id}`);

    const savedDoc = await docRef.get();

    // Feature 6: Notify Leader - REMOVED per user request
    // Leaders should NOT receive notifications for new bug reports.

    // Feature: System Message in Chat (Optional/Preserved if needed, but avoiding Chat logic touch per rules unless required)
    // Keeping it minimal.


    res.status(201).json(normalizeBug(savedDoc));
  } catch (error) {
    log(`[createBug] ERROR: ${error.message}\n${error.stack}`);
    console.error("Error creating bug:", error);
    res.status(500).json({ message: "Failed to report bug", error: error.message });
  }
};

// Get bugs (Filtered by Role)
export const getBugs = async (req, res) => {
  try {
    const { teamId: rawTeamId } = req.params;
    const teamId = rawTeamId.trim();
    const { uid } = req.user;

    let role = req.user.role;
    // ... (rest of getBugs logic can stay, or simplified if middleware is trusted)
    // For safety, we keep the fallback role check from before or rely on middleware

    // Base query: bugs for this team
    let query = db.collection("bugs").where("teamId", "==", teamId);

    // Feature 5 Requirement: Member can see "Only their bugs"
    if (role === 'member') {
      query = query.where("reportedById", "==", uid);
    }

    const snapshot = await query.get();
    const bugs = snapshot.docs.map(doc => normalizeBug(doc));

    // Sort in memory or use orderBy in query (requires index)
    // Using memory sort for now to avoid index issues
    bugs.sort((a, b) => {
      const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });

    res.status(200).json(bugs);
  } catch (error) {
    console.error("Error fetching bugs:", error);
    res.status(500).json({ message: "Failed to fetch bugs", error: error.message });
  }
};

// Update Bug Status (Leader AND Members)
export const updateBugStatus = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { status } = req.body;
    const { role, teamId } = req.user;

    const bugRef = db.collection("bugs").doc(bugId);
    const bugDoc = await bugRef.get();

    if (!bugDoc.exists) {
      return res.status(404).json({ message: "Bug not found" });
    }

    const bugData = bugDoc.data();

    // Security: Only allow update if user belongs to the same team
    if (String(bugData.teamId) !== String(teamId)) {
      return res.status(403).json({ message: "Access denied. Different team." });
    }

    // Members can update status too (Open -> In Progress -> Resolved)
    const validStatuses = ["Open", "In Progress", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Permission Check: Members can only update their own bugs
    if (role === 'member' && String(bugData.reportedById) !== String(req.user.uid)) {
      return res.status(403).json({ message: "Access denied. You can only update bugs you reported." });
    }

    await bugRef.update({ status });

    // Feature 6: Notify Reporter if status changed by Leader
    // If user is Leader, notify Reporter
    if (req.user.role === 'leader' && bugData.reportedById) {
      await createNotification(
        bugData.reportedById,
        teamId,
        'STATUS_UPDATED',
        `Your bug "${bugData.title}" was updated to ${status}`
      );
    }

    // Feature: Notify Leader if Member updates status (In Progress / Resolved)
    if (req.user.role === 'member' && (status === 'Resolved' || status === 'In Progress')) {
      const leaderQuery = await db.collection("users")
        .where("teamId", "==", teamId)
        .where("role", "==", "leader")
        .limit(1)
        .get();

      if (!leaderQuery.empty) {
        const leaderId = leaderQuery.docs[0].id;
        await createNotification(
          leaderId,
          teamId,
          'BUG_STATUS_UPDATED',
          `${req.user.name || 'A member'} updated bug "${bugData.title}" to ${status}`
        );
      }
    }

    res.status(200).json({ id: bugId, status });
  } catch (error) {
    console.error("Error updating bug status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// Delete Bug (Leader Only)
export const deleteBug = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { role, teamId } = req.user;

    if (role !== "leader") {
      return res.status(403).json({ message: "Access denied. Only leaders can delete bugs." });
    }

    const bugRef = db.collection("bugs").doc(bugId);
    const bugDoc = await bugRef.get();

    if (!bugDoc.exists) {
      return res.status(404).json({ message: "Bug not found" });
    }

    const bugData = bugDoc.data();

    // Security: Leader can only delete bugs for THEIR team
    // Note: Use string comparison to be safe
    if (String(bugData.teamId) !== String(teamId)) {
      console.warn(`[Security] Leader ${req.user.uid} (Team ${teamId}) tried to delete bug ${bugId} (Team ${bugData.teamId})`);
      return res.status(403).json({ message: "Access denied. You can only delete bugs for your team." });
    }

    // 3. Status Check REMOVED: Leaders can delete bugs in any status
    // if (bugData.status !== "Resolved") {
    //   return res.status(400).json({ message: "Cannot delete active bugs. Mark as Resolved first." });
    // }

    await bugRef.delete();
    console.log(`[Success] Bug ${bugId} deleted by leader ${req.user.name}`);
    res.status(200).json({ message: "Bug deleted successfully" });
  } catch (error) {
    console.error("Error deleting bug:", error);
    res.status(500).json({ message: "Failed to delete bug" });
  }
};
