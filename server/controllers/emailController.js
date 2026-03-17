/**
 * Email Controller
 * Handles email notifications for TaskHive events
 */

import {
  sendTaskAssignmentEmail,
  sendTeamInvitationEmail,
  sendDeadlineReminderEmail,
  sendLeadershipTransitionEmail,
  sendBugAssignmentEmail,
  testConnection
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

/**
 * Send bug assignment notification email
 */
export const sendBugAssignment = async (req, res) => {
  try {
    const { email, name, bugData, reporterName, teamName } = req.body;

    if (!email || !name || !bugData || !reporterName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await sendBugAssignmentEmail(
      email,
      name,
      bugData,
      reporterName,
      teamName
    );

    return res.status(200).json({
      success: true,
      message: "Bug assignment email sent"
    });
  } catch (error) {
    console.error("❌ Error sending bug assignment email:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Test email connection
 */
export const testEmail = async (req, res) => {
  try {
    const result = await testConnection();
    if (result.success) {
      // Also try sending a real test email if a target is provided
      const targetEmail = req.query.email || process.env.EMAIL_USER;
      if (targetEmail) {
        const { testConnection: _, ...rest } = await import("../utils/emailService.js");
        // We can just use a generic sendMail if we wanted, but let's just test verify for now
        // Or send a real "Ping"
        console.log(`[TEST] Attempting to send ping email to ${targetEmail}`);
      }
      
      return res.status(200).json({
        success: true,
        message: "Email service connection verified",
        details: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Email service connection failed",
        error: result.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Test execution failed",
      error: error.message
    });
  }
};

export default {
  sendTaskAssignment,
  sendTeamInvitation,
  sendDeadlineReminder,
  sendLeadershipTransition,
  sendBugAssignment,
  testEmail
};
