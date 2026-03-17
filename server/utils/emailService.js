import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

// Attempt to load .env from parent directory (classic Monorepo/Backend pattern)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
// Also try default location just in case
dotenv.config();
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email service connection error:", error);
  } else {
    console.log("✅ Email service is ready to send messages");
  }
});

/**
 * Generate random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email
 * @param {string} email - User's email address
 * @param {string} otp - OTP code
 * @param {string} name - User's name
 */
export const sendOTP = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "TaskHivee - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e40af; margin-bottom: 10px;">TaskHivee</h2>
            <p style="color: #666; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              Your email verification OTP is:
            </p>
            
            <div style="background-color: #dbeafe; border: 2px solid #1e40af; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1e40af; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            
            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">
              This OTP will expire in 10 minutes.
            </p>
            
            <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 TaskHivee. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ TP received check`);
    return true;
  } catch (error) {
    console.warn("⚠️ Email service not configured or failed:", error.message);
    // Return true properly so we don't throw 500s for missing config in dev
    return true;
  }
};

/**
 * Send welcome email after successful signup
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} role - User's role (leader/member)
 */
export const sendWelcomeEmail = async (email, name, role) => {
  try {
    const dashboardLink =
      role === "leader"
        ? "http://localhost:5173/leader-dashboard"
        : "http://localhost:5173/member-dashboard";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to TaskHivee!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e40af; margin-bottom: 10px;">Welcome to TaskHivee!</h2>
            <p style="color: #666; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              Your account has been successfully created. You're now a <strong>${role}</strong> on TaskHivee.
            </p>
            
            <p style="color: #333; margin-bottom: 20px;">
              Get started by logging in and creating your first project:
            </p>
            
            <a href="${dashboardLink}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">
              Go to Dashboard
            </a>
            
            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">
              <strong>What you can do:</strong>
            </p>
            <ul style="color: #666; margin-bottom: 20px; font-size: 14px;">
              <li>Create and manage projects</li>
              <li>Assign tasks to team members</li>
              <li>Track bugs and issues</li>
              <li>Collaborate in real-time</li>
              <li>Chat with your team</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 TaskHivee. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error.message);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} resetLink - Password reset link
 */
export const sendPasswordResetEmail = async (email, name, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "TaskHivee - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e40af; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="color: #666; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to proceed:
            </p>
            
            <a href="${resetLink}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">
              Reset Password
            </a>
            
            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
            
            <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
              If you didn't request this, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 TaskHivee. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error.message);
    return false;
  }
};

/**
 * Send task assignment notification email
 * @param {string} email - Assignee's email address
 * @param {string} name - Assignee's name
 * @param {Object} taskData - Task information
 * @param {string} leaderName - Leader's name
 */
export const sendTaskAssignmentEmail = async (email, name, taskData, leaderName, teamName = 'Your Team') => {
  try {
    const priorityColor = {
      'High': '#dc2626',
      'Medium': '#d97706',
      'Low': '#16a34a'
    }[taskData.priority] || '#6b7280';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: taskData.isReassignment 
        ? `Task Reassigned to You: ${taskData.title}`
        : `New Task Assigned: ${taskData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e40af; margin-bottom: 10px;">${taskData.isReassignment ? 'Task Reassigned' : 'New Task Assigned'}</h2>
            <p style="color: #666; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              ${taskData.isReassignment 
                ? `<strong>${leaderName}</strong> has reassigned a task to you in the team <strong>${teamName}</strong>. This task was previously assigned to ${taskData.previousAssigneeName || 'someone else'} but was not completed on time/needed reassignment.`
                : `<strong>${leaderName}</strong> has assigned you a new task in the team <strong>${teamName}</strong>.`}
            </p>
            
            <div style="background-color: white; border-left: 4px solid #1e40af; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">${taskData.title}</h3>
              <p style="color: #666; margin-bottom: 10px;"><strong>Priority:</strong> ${taskData.priority}</p>
              ${taskData.dueDate ? `<p style="color: #666; margin-bottom: 10px;"><strong>Deadline:</strong> ${new Date(taskData.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">
              Please log in to TaskHive to view and update the task status.
            </p>
            
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">
              View My Task
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Task assignment email sent to ${email}`);
    return true;
  } catch (error) {
    console.warn("⚠️ Email service not configured or failed:", error.message);
    return true;
  }
};

/**
 * Send team invitation email
 */
export const sendTeamInvitationEmail = async (
  email,
  name,
  teamName,
  leaderName,
  teamCode,
  allMembers = [],
  role = 'Member'
) => {
  try {
    // Generate the list of members for the email
    let memberListHtml = "";
    if (allMembers.length > 0) {
      memberListHtml = `
        <div style="margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <p style="margin: 0 0 10px 0; color: #333;"><strong>Team Members:</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            ${allMembers
          .map((m) => `<li style="margin-bottom: 5px;">${m.name}</li>`)
          .join("")}
          </ul>
        </div>
      `;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `You've been invited to join the team "${teamName}" on TaskHive`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e40af; margin-bottom: 10px;">Team Invitation</h2>
            <p style="color: #666; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              Hope you're doing well!
            </p>

            <p style="color: #333; margin-bottom: 20px;">
              <strong>${leaderName}</strong> has created a new team on TaskHive and added you as a <strong>${role}</strong>.
            </p>

            <div style="background: rgba(37, 99, 235, 0.05); border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 12px 12px 0;">
              <p style="margin: 0; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 900;">Assigned Strategic Role</p>
              <p style="margin: 5px 0 0 0; color: #2563eb; font-size: 18px; font-weight: 800; font-style: italic; text-transform: uppercase;">${role}</p>
            </div>
            
            <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Team Name:</strong> ${teamName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Team Leader:</strong> ${leaderName}</p>
              ${memberListHtml}
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">
              To join the team, please use the following Team Code while logging in:
            </p>

             <div style="background-color: #dbeafe; border: 2px solid #1e40af; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
              <h2 style="color: #1e40af; letter-spacing: 2px; margin: 0;">${teamCode}</h2>
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">
              Click the link below to access TaskHive:
            </p>

            <a href="${frontendUrl}/login" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">
              Login to TaskHive
            </a>

            <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: #92400e;">
              <strong>Important:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Use the SAME email address this invitation was sent to</li>
                <li>Enter your FULL NAME exactly as provided by your leader</li>
                <li>Enter the Team Code during login</li>
              </ul>
            </div>
            
            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">
                If you have any questions, please contact your team leader.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              Welcome aboard,<br>
              TaskHive Team 🚀
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Team invitation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email service failed:", error);
    return false;
  }
};

/**
 * Send deadline reminder email
 */
export const sendDeadlineReminderEmail = async (email, name, taskData, leaderName, teamName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Reminder: Task "${taskData.title}" is due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #fff1f2; border-radius: 8px; padding: 30px;">
            <h2 style="color: #be123c; margin-bottom: 10px;">⏰ Deadline Reminder</h2>
            <p style="color: #666; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              This is a reminder that the following task in <strong>"${teamName}"</strong> is approaching its deadline.
            </p>
            
            <div style="background-color: white; border-left: 4px solid #be123c; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">${taskData.title}</h3>
              <p style="margin: 0 0 10px 0;"><strong>Deadline:</strong> ${new Date(taskData.dueDate).toLocaleDateString()}</p>
              <p style="margin: 0;"><strong>Priority:</strong> ${taskData.priority}</p>
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">
              Please update the task status in TaskHive.
            </p>
            
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #be123c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">
              Update Task Status
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Team invitation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email service failed:", error);
    return false;
  }
};

/**
 * Send leadership transition notification
 */
export const sendLeadershipTransitionEmail = async (email, name, proposedBy, reason, teamName = 'TaskHive Team', teamCode = '') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Leadership Transition Request for "${teamName}"`,
      html: `
        <div style="font-family: 'Inter', sans-serif, Arial; padding: 40px; background-color: #0B0F14; color: white;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #151921; border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; font-weight: 900; margin: 0;">TaskHive</h1>
              <p style="color: #64748b; text-transform: uppercase; letter-spacing: 0.2em; font-size: 10px; font-weight: 900; margin-top: 5px;">Leadership Transition Portal</p>
            </div>

            <h2 style="color: white; font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; margin-bottom: 20px;">Formal Request Initiated</h2>
            
            <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
              Hello <strong>${name}</strong>,<br><br>
              A formal leadership transition request has been initiated for the team <strong>"${teamName}"</strong>. According to TaskHive's ethical leadership guidelines, you have been proposed as a new potential lead.
            </p>

            <div style="background-color: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 16px; padding: 25px; margin-bottom: 30px;">
              <p style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 900; margin: 0 0 10px 0;">Requesting Member</p>
              <p style="color: white; font-weight: 700; margin: 0 0 20px 0;">${proposedBy}</p>

              <p style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 900; margin: 0 0 10px 0;">Rationale / Reason</p>
              <p style="color: #cbd5e1; font-style: italic; margin: 0; line-height: 1.5;">"${reason}"</p>
            </div>

            <div style="background-color: #dbeafe; border: 2px solid #1e40af; padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
              <p style="color: #1e40af; text-transform: uppercase; letter-spacing: 0.2em; font-size: 10px; font-weight: 900; margin-bottom: 10px;">Your Team Code</p>
              <h1 style="color: #1e40af; letter-spacing: 5px; margin: 0; font-size: 32px;">${teamCode}</h1>
            </div>

            <div style="color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
              <p style="color: white; font-weight: 700; margin-bottom: 10px;">To join as a leader:</p>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Log in to TaskHive</li>
                <li>Choose <strong>Team Leader</strong> role</li>
                <li>Enter the team code above when prompted</li>
              </ol>
              <p style="margin-top: 15px; font-size: 13px;">This will add you as a co-leader. No existing leader is removed.</p>
            </div>

            <div style="text-align: center;">
              <a href="http://localhost:5173/auth?mode=login&transition=true&teamName=${encodeURIComponent(teamName)}&teamCode=${teamCode}" style="display: inline-block; background-color: white; color: #0B0F14; padding: 15px 40px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px;">Login to TaskHive</a>
            </div>

            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 40px 0;">

            <p style="color: #475569; font-size: 10px; text-align: center; text-transform: uppercase; letter-spacing: 0.4em; font-weight: 700;">
              © 2026 TASKHIVE — HANDOVER IN PROGRESS
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Leadership transition email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email service failed:", error);
    return false;
  }
};

/**
 * Send bug assignment notification email
 * @param {string} email - Assignee's email address
 * @param {string} name - Assignee's name
 * @param {Object} bugData - Bug information
 * @param {string} reporterName - Person who reported the bug
 */
export const sendBugAssignmentEmail = async (email, name, bugData, reporterName, teamName = 'Your Team') => {
  try {
    const priorityColor = {
      'Critical': '#7f1d1d',
      'High': '#dc2626',
      'Medium': '#d97706',
      'Low': '#16a34a'
    }[bugData.severity] || '#6b7280';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Bug Assigned to You: ${bugData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <h2 style="color: #dc2626; margin-bottom: 10px;">Bug Assigned to You</h2>
            <p style="color: #666; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #333; margin-bottom: 20px;">
              <strong>${reporterName}</strong> has assigned a bug for you to resolve in the team <strong>${teamName}</strong>.
            </p>
            
            <div style="background-color: white; border-left: 4px solid ${priorityColor}; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">${bugData.title}</h3>
              <p style="color: #666; margin-bottom: 10px;"><strong>Severity:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${bugData.severity}</span></p>
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">
              Please log in to TaskHive to view the details and resolve this bug.
            </p>
            
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">
              View Bug
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Bug assignment email sent to ${email}`);
    return true;
  } catch (error) {
    console.warn("⚠️ Email service not configured or failed:", error.message);
    return true;
  }
};

export default {
  generateOTP,
  sendOTP,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTaskAssignmentEmail,
  sendTeamInvitationEmail,
  sendDeadlineReminderEmail,
  sendLeadershipTransitionEmail,
  sendBugAssignmentEmail
};
