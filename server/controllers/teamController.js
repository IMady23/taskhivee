/**
 * Team Controller
 * Handles team creation and management
 */
import { db } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import { sendTeamInvitationEmail } from "../utils/emailService.js";

/**
 * Generate a random 6-character team code
 */
const generateTeamCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Create a new team and invite members
 * POST /api/teams/create
 */
export const createTeam = async (req, res) => {
    try {
        const { teamName, members } = req.body;
        const leaderId = req.user.uid;
        const leaderName = req.user.name || "Team Leader";

        // Validation
        if (!teamName) {
            return res.status(400).json({ message: "Team name is required" });
        }

        if (!members || !Array.isArray(members)) {
            return res.status(400).json({ message: "Members list is required" });
        }

        // Generate unique team code
        let teamCode;
        let isUnique = false;
        while (!isUnique) {
            teamCode = generateTeamCode();
            const existingTeam = await db.collection("teams").where("teamCode", "==", teamCode).get();
            if (existingTeam.empty) {
                isUnique = true;
            }
        }

        // Prepare team data
        const newTeamRef = db.collection("teams").doc();
        const teamData = {
            name: teamName,
            leaderId,
            leaderName,
            teamCode,
            members: [leaderId], // Leader is always a member
            invitedMembers: members.map(m => ({
                name: m.name,
                email: m.email,
                status: 'invited',
                invitedAt: new Date().toISOString()
            })),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        // Save to Firestore
        await newTeamRef.set(teamData);

        // Update Leader's profile to include this team
        await db.collection("users").doc(leaderId).update({
            teamId: newTeamRef.id,
            role: 'leader' // Ensure they are marked as leader
        });

        // Send invitations asynchronously (fire and forget to not block response? 
        // Plan said "Immediately after team is successfully saved")
        // Let's await it to ensure at least the process starts, but logically we can send response 
        // if we trust the email service. User asked to "Stop after implementation", but verify.
        // We will await to be safe and report errors if email service fails completely (though it usually just logs).

        // Collect all invited member names for the email template
        const allMemberNames = members.map(m => m.name);

        const emailPromises = members.map(member =>
            sendTeamInvitationEmail(
                member.email,
                member.name,
                teamName,
                leaderName,
                teamCode,
                members // Pass full member objects for the list
            )
        );

        await Promise.all(emailPromises);

        return res.status(201).json({
            success: true,
            message: "Team created and invitations sent successfully",
            teamId: newTeamRef.id,
            teamCode
        });

    } catch (error) {
        console.error("❌ Error creating team:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create team",
            error: error.message
        });
    }
};


// ============================================
// WORKLOAD MANAGEMENT ENDPOINTS
// ============================================

import WorkloadCalculator from "../services/WorkloadCalculator.js";

/**
 * Get workload data for all team members
 * GET /api/teams/:teamId/workload
 */
export const getTeamWorkload = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid, role } = req.user;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view workload
    if (!teamData.members.includes(uid)) {
      return res.status(403).json({ message: "Not authorized to view this team's workload" });
    }

    // Calculate workload for all team members
    const workloadMap = await WorkloadCalculator.calculateTeamWorkload(teamId);

    // Convert map to array for response
    const workloadData = Array.from(workloadMap.values());

    // Get summary statistics
    const summary = await WorkloadCalculator.getTeamWorkloadSummary(teamId);

    res.status(200).json({
      teamId,
      teamName: teamData.name,
      workload: workloadData,
      summary,
    });
  } catch (error) {
    console.error("Error getting team workload:", error);
    res.status(500).json({
      message: "Failed to get team workload",
      error: error.message,
    });
  }
};

/**
 * Get workload data for a specific member
 * GET /api/teams/:teamId/workload/:memberId
 */
export const getMemberWorkload = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { uid } = req.user;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view workload
    if (!teamData.members.includes(uid)) {
      return res.status(403).json({ message: "Not authorized to view this team's workload" });
    }

    // Calculate workload for the specific member
    const workload = await WorkloadCalculator.calculateWorkload(memberId);

    // Get member info
    const memberDoc = await db.collection("users").doc(memberId).get();
    const memberData = memberDoc.exists ? memberDoc.data() : {};

    res.status(200).json({
      memberId,
      memberName: memberData.name,
      memberEmail: memberData.email,
      ...workload,
    });
  } catch (error) {
    console.error("Error getting member workload:", error);
    res.status(500).json({
      message: "Failed to get member workload",
      error: error.message,
    });
  }
};


// ============================================
// HEALTH SCORE ENDPOINTS
// ============================================

import HealthScoreCalculator from "../services/HealthScoreCalculator.js";

/**
 * Get current health score for a team
 * GET /api/teams/:teamId/health-score
 */
export const getTeamHealthScore = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid } = req.user;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view health score
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team's health score" });
    }

    // Check if team has enough data
    const tasksSnapshot = await db
      .collection("tasks")
      .where("teamId", "==", teamId)
      .get();

    const completedTasks = tasksSnapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === "Done" || status === "completed";
    });

    console.log('[HealthScore] Team has', completedTasks.length, 'completed tasks out of', tasksSnapshot.size, 'total');

    if (completedTasks.length < 5) {
      return res.status(200).json({
        message: "Insufficient data for health score (minimum 5 completed tasks required)",
        hasEnoughData: false,
        completedTasks: completedTasks.length,
      });
    }

    // Calculate health score
    const healthScore = await HealthScoreCalculator.calculateHealthScore(teamId);

    // Store the score
    await HealthScoreCalculator.storeHealthScore(teamId, healthScore);

    res.status(200).json({
      teamId,
      teamName: teamData.name,
      hasEnoughData: true,
      ...healthScore,
      color: HealthScoreCalculator.getScoreColor(healthScore.score),
    });
  } catch (error) {
    console.error("Error getting team health score:", error);
    res.status(500).json({
      message: "Failed to get health score",
      error: error.message,
    });
  }
};

/**
 * Get historical health scores for a team
 * GET /api/teams/:teamId/health-history
 */
export const getTeamHealthHistory = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid } = req.user;
    const limit = parseInt(req.query.limit) || 30;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view health history
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team's health history" });
    }

    // Get historical scores
    const history = await HealthScoreCalculator.getHealthHistory(teamId, limit);

    res.status(200).json({
      teamId,
      teamName: teamData.name,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Error getting health history:", error);
    res.status(500).json({
      message: "Failed to get health history",
      error: error.message,
    });
  }
};


// ============================================
// ACTIVITY TIMELINE ENDPOINTS
// ============================================

import ActivityLogger from "../services/ActivityLogger.js";

/**
 * Get activity timeline for a team
 * GET /api/teams/:teamId/activity-timeline
 */
export const getActivityTimeline = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid } = req.user;

    // Query parameters for filtering and pagination
    const filters = {
      eventType: req.query.eventType,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const pagination = {
      limit: parseInt(req.query.limit) || 50,
      cursor: req.query.cursor,
    };

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view activity
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team's activity" });
    }

    // Get events
    const result = await ActivityLogger.getEvents(teamId, filters, pagination);

    // Format events for display
    const formattedEvents = result.events.map((event) => ({
      ...event,
      description: ActivityLogger.formatEventDescription(event),
      icon: ActivityLogger.getEventIcon(event.eventType),
    }));

    res.status(200).json({
      teamId,
      teamName: teamData.name,
      events: formattedEvents,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error("Error getting activity timeline:", error);
    res.status(500).json({
      message: "Failed to get activity timeline",
      error: error.message,
    });
  }
};

/**
 * Get available filter options for activity timeline
 * GET /api/teams/:teamId/activity-timeline/filters
 */
export const getActivityFilters = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid } = req.user;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view filters
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team's activity" });
    }

    // Get filter options
    const filterOptions = await ActivityLogger.getFilterOptions(teamId);

    res.status(200).json({
      teamId,
      ...filterOptions,
    });
  } catch (error) {
    console.error("Error getting activity filters:", error);
    res.status(500).json({
      message: "Failed to get activity filters",
      error: error.message,
    });
  }
};


// ============================================
// AI WEEKLY SUMMARY ENDPOINTS
// ============================================

import AISummaryService from "../services/AISummaryService.js";

/**
 * Generate weekly summary for a team
 * POST /api/teams/:teamId/generate-summary
 */
export const generateWeeklySummary = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid, role } = req.user;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only leaders can generate summaries
    if (role !== "leader" && teamData.leaderId !== uid) {
      return res
        .status(403)
        .json({ message: "Only team leaders can generate summaries" });
    }

    // Collect weekly metrics
    const metrics = await AISummaryService.collectWeeklyMetrics(teamId);

    // Check if there's any activity
    if (metrics.tasksCompleted === 0 && metrics.bugsCreated === 0) {
      return res.status(200).json({
        message: "No activity in the past week to summarize",
        hasActivity: false,
      });
    }

    // Generate summary using AI
    const summaryResult = await AISummaryService.generateSummary(
      metrics,
      teamData.name
    );

    // Store the summary
    const summaryId = await AISummaryService.storeSummary(
      teamId,
      {
        summary: summaryResult.summary,
        metrics,
      },
      uid
    );

    res.status(200).json({
      success: true,
      summaryId,
      summary: summaryResult.summary,
      metrics,
      generatedAt: summaryResult.generatedAt,
      tokensUsed: summaryResult.tokensUsed,
    });
  } catch (error) {
    console.error("Error generating weekly summary:", error);
    res.status(500).json({
      message: "Failed to generate summary",
      error: error.message,
    });
  }
};

/**
 * Get historical summaries for a team
 * GET /api/teams/:teamId/summaries
 */
export const getTeamSummaries = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid } = req.user;
    const limit = parseInt(req.query.limit) || 10;

    // Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // Authorization: Only team members can view summaries
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team's summaries" });
    }

    // Get summaries
    const summaries = await AISummaryService.getSummaries(teamId, limit);

    res.status(200).json({
      teamId,
      teamName: teamData.name,
      count: summaries.length,
      summaries,
    });
  } catch (error) {
    console.error("Error getting team summaries:", error);
    res.status(500).json({
      message: "Failed to get summaries",
      error: error.message,
    });
  }
};
