/**
 * Email Controller
 * Handles email notifications for TaskHive events
 */

import {
  sendTaskAssignmentEmail,
  sendTeamInvitationEmail,
  sendDeadlineReminderEmail,
  sendLeadershipTransitionEmail
} from "../utils/emailService.js";

/**
 * Send task assignment notification email
 */
export const sendTaskAssignment = async (req, res) => {
  try {
    const {
      assigneeEmail,
      assigneeName,
      taskData,
      leaderName,
      teamName
    } = req.body;

    // 🔎 Validation
    if (!assigneeEmail || !assigneeName || !taskData || !leaderName) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: assigneeEmail, assigneeName, taskData, leaderName"
      });
    }

    // 🔎 Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(assigneeEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    await sendTaskAssignmentEmail(
      assigneeEmail,
      assigneeName,
      taskData,
      leaderName,
      teamName
    );

    return res.status(200).json({
      success: true,
      message: "Task assignment email sent successfully"
    });
  } catch (error) {
    console.error("❌ Error sending task assignment email:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Send team invitation email
 */
export const sendTeamInvitation = async (req, res) => {
  try {
    const { email, name, teamName, leaderName, teamCode, role } = req.body;

    if (!email || !name || !teamName || !leaderName || !teamCode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await sendTeamInvitationEmail(
      email,
      name,
      teamName,
      leaderName,
      teamCode,
      [], // allMembers default
      role || 'Member' // TaskHive Role Enhancement
    );

    return res.status(200).json({
      success: true,
      message: "Team invitation email sent"
    });
  } catch (error) {
    console.error("❌ Error sending team invitation email:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Send deadline reminder email
 */
export const sendDeadlineReminder = async (req, res) => {
  try {
    const { email, name, taskData, leaderName, teamName } = req.body;

    if (!email || !name || !taskData || !leaderName || !teamName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await sendDeadlineReminderEmail(
      email,
      name,
      taskData,
      leaderName,
      teamName
    );

    return res.status(200).json({
      success: true,
      message: "Deadline reminder email sent"
    });
  } catch (error) {
    console.error("❌ Error sending deadline reminder email:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Send leadership transition email
 */
export const sendLeadershipTransition = async (req, res) => {
  try {
    const { email, name, proposedBy, reason, teamName, teamCode } = req.body;

    if (!email || !proposedBy || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await sendLeadershipTransitionEmail(
      email,
      name || email,
      proposedBy,
      reason,
      teamName,
      teamCode
    );

    return res.status(200).json({
      success: true,
      message: "Leadership transition email sent"
    });
  } catch (error) {
    console.error("❌ Error sending leadership transition email:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export default {
  sendTaskAssignment,
  sendTeamInvitation,
  sendDeadlineReminder,
  sendLeadershipTransition
};
