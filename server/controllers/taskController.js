/**
 * Task Controller
 * Handles CRUD operations for tasks
 * Methods: createTask, updateTask, deleteTask, getTasksByUser, getTasksByProject
 */

import { db, admin } from "../config/firebase.js";
import { createNotification } from "./notificationController.js";
import DependencyResolver from "../services/DependencyResolver.js";
import { sendTaskAssignmentEmail } from "../utils/emailService.js";

// TODO: createTask - Create a new task
// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { uid, name, teamId } = req.user;

    if (!title || !teamId) {
      return res.status(400).json({ message: 'Title and Team ID are required' });
    }

    const newTask = {
      title,
      description: description || '',
      assignedTo: assignedTo || null, // Member ID
      assignedToName: req.body.assignedToName || 'Member', // Store name for display
      createdBy: uid,
      createdByName: name || 'Leader',
      teamId,
      status: 'To Do',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('tasks').add(newTask);
    const savedTask = await docRef.get();

    // Notify Assigned Member
    if (assignedTo) {
      // In-app notification
      await createNotification(
        assignedTo,
        teamId,
        'TASK_ASSIGNED',
        `You have been assigned a new task: ${title}`
      );

      // Email notification
      try {
        // Fetch assignee email and team name
        const [userDoc, teamDoc] = await Promise.all([
          db.collection('users').doc(assignedTo).get(),
          db.collection('teams').doc(teamId).get()
        ]);

        if (userDoc.exists && teamDoc.exists) {
          const userData = userDoc.data();
          const teamData = teamDoc.data();
          
          if (userData.email) {
            await sendTaskAssignmentEmail(
              userData.email,
              userData.name || 'Team Member',
              { title, priority: priority || 'Medium', dueDate: dueDate || null },
              name || 'Team Leader',
              teamData.name || 'Your Team'
            );
          }
        }
      } catch (emailError) {
        console.error('❌ Failed to send assignment email during createTask:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    res.status(201).json({ id: docRef.id, ...savedTask.data() });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// ... (skipping unchanged methods) ...

// TODO: changeTaskStatus - Change task status (with notification)
// Update task status
export const changeTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { uid, role, teamId, name } = req.user;

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskDoc.data();

    // Prepare update object
    const updates = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // If task is being completed, add completedAt timestamp and clear risk/friction
    if (status === 'Done' || status === 'completed') {
      updates.completedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.riskStatus = 'none';
      updates.isFrictionTask = false;
    }

    // Update status
    await taskRef.update(updates);

    // Log activity event
    const ActivityLogger = (await import('../services/ActivityLogger.js')).default;
    await ActivityLogger.logEvent({
      teamId: taskData.teamId,
      userId: uid,
      userName: name || 'User',
      eventType: 'task_status_changed',
      entityType: 'task',
      entityId: taskId,
      entityName: taskData.title,
      metadata: {
        oldStatus: taskData.status,
        newStatus: status
      }
    });

    // Notify Leader if Member completes task
    if (role === 'member' && (status === 'Done' || status === 'completed')) {
      // Look up leader
      // Optimization: If task has createdBy, notify them. Else find generic leader.
      const leaderId = taskData.createdBy;

      // Fallback query if createdBy isn't valid or is same as user
      if (leaderId && leaderId !== uid) {
        await createNotification(
          leaderId,
          teamId,
          'TASK_COMPLETED',
          `${name || 'A member'} completed task: ${taskData.title}`
        );
      } else {
        // Query for team leader
        const leaderQuery = await db.collection("users")
          .where("teamId", "==", teamId)
          .where("role", "==", "leader")
          .limit(1)
          .get();

        if (!leaderQuery.empty) {
          const actualLeaderId = leaderQuery.docs[0].id;
          await createNotification(
            actualLeaderId,
            teamId,
            'TASK_COMPLETED',
            `${name || 'A member'} completed task: ${taskData.title}`
          );
        }
      }
    }

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(teamId).emit('task:updated', {
        taskId,
        status,
        completedAt: status === 'Done' || status === 'completed' ? new Date().toISOString() : null
      });

      // Emit workload update
      io.to(teamId).emit('workload:updated', { teamId });
    }

    res.status(200).json({ id: taskId, status, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// TODO: updateTask - Update task details
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assignedTo, assignedToName, reason } = req.body;
    const { uid, role, teamId, name } = req.user;

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Authorization: Only leader or task creator can update task
    if (role !== 'leader' && taskData.createdBy !== uid) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Track reassignment if assignedTo is changing
    if (assignedTo !== undefined && assignedTo !== taskData.assignedTo) {
      const reassignmentCount = (taskData.reassignmentCount || 0) + 1;
      const reassignmentHistory = taskData.reassignmentHistory || [];
      
      reassignmentHistory.push({
        fromMember: taskData.assignedTo,
        fromMemberName: taskData.assignedToName || 'Unassigned',
        toMember: assignedTo,
        toMemberName: assignedToName || 'Member',
        timestamp: new Date().toISOString(),
        reason: reason || 'No reason provided',
        reassignedBy: uid,
        reassignedByName: name || 'Leader'
      });

      updates.assignedTo = assignedTo;
      updates.assignedToName = assignedToName || 'Member';
      updates.reassignmentCount = reassignmentCount;
      updates.reassignmentHistory = reassignmentHistory;
      updates.isFrictionTask = reassignmentCount > 2;

      // Notify new assignee
      if (assignedTo) {
        await createNotification(
          assignedTo,
          teamId,
          'TASK_ASSIGNED',
          `You have been assigned task: ${taskData.title}`
        );
      }

      // Notify previous assignee
      if (taskData.assignedTo) {
        await createNotification(
          taskData.assignedTo,
          teamId,
          'TASK_REASSIGNED',
          `Task "${taskData.title}" has been reassigned`
        );
      }

      // Email notification for new assignee
      if (assignedTo) {
        try {
          // Fetch assignee email and team name
          const [userDoc, teamDoc] = await Promise.all([
            db.collection('users').doc(assignedTo).get(),
            db.collection('teams').doc(teamId).get()
          ]);

          if (userDoc.exists && teamDoc.exists) {
            const userData = userDoc.data();
            const teamData = teamDoc.data();
            
            if (userData.email) {
              // Determine if this is a new assignment or a reassignment from someone else
              const isReassignment = taskData.assignedTo && taskData.assignedTo !== assignedTo;
              
              await sendTaskAssignmentEmail(
                userData.email,
                userData.name || 'Team Member',
                { 
                  title: title || taskData.title, 
                  priority: priority || taskData.priority, 
                  dueDate: dueDate || taskData.dueDate,
                  isReassignment,
                  previousAssigneeName: isReassignment ? (taskData.assignedToName || 'someone else') : null
                },
                name || 'Team Leader',
                teamData.name || 'Your Team'
              );
            }
          }
        } catch (emailError) {
          console.warn('⚠️ Failed to send reassignment email:', emailError.message);
        }
      }
    }

    // Update other fields if provided
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    await taskRef.update(updates);

    const updatedTask = await taskRef.get();

    res.status(200).json({
      message: 'Task updated successfully',
      task: {
        id: taskId,
        ...updatedTask.data()
      },
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// TODO: deleteTask - Delete a task
export const deleteTask = async (req, res) => {
  try {
    // Validate taskId
    // Delete task document
    // Return success message
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// TODO: getTasksByUser - Get all tasks assigned to a user
export const getTasksByUser = async (req, res) => {
  try {
    // Get userId from params or auth
    // Find all tasks where assignedTo === userId
    // Populate references
    // Return task list with pagination
    res.status(200).json({
      message: 'Tasks retrieved',
      tasks: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

// TODO: getTasksByProject - Get all tasks in a project
export const getTasksByProject = async (req, res) => {
  try {
    // Get projectId from params
    // Find all tasks where project === projectId
    // Populate references
    // Group by status (optional)
    // Return task list
    res.status(200).json({
      message: 'Project tasks retrieved',
      tasks: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch project tasks', error: error.message });
  }
};

// TODO: addTaskComment - Add comment to a task
export const addTaskComment = async (req, res) => {
  try {
    // Get taskId and comment text
    // Add comment to task.comments array
    // Return updated task
    res.status(201).json({
      message: 'Comment added',
      task: {},
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};




// ============================================
// DEPENDENCY MANAGEMENT ENDPOINTS
// ============================================

/**
 * Update task dependencies
 * PUT /api/tasks/:id/dependencies
 */
export const updateTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dependsOn } = req.body;
    const { uid, role } = req.user;

    // Validate input
    if (!Array.isArray(dependsOn)) {
      return res.status(400).json({ message: "dependsOn must be an array" });
    }

    // Get task
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskDoc.data();

    // Authorization: Only leader or task creator can update dependencies
    if (role !== "leader" && taskData.createdBy !== uid) {
      return res
        .status(403)
        .json({ message: "Only leaders can update task dependencies" });
    }

    // Validate no self-dependency
    if (!DependencyResolver.validateNoSelfDependency(taskId, dependsOn)) {
      return res
        .status(400)
        .json({ message: "Cannot add dependency: task cannot depend on itself" });
    }

    // Validate dependencies exist and are in same team
    const { valid, invalidIds } = await DependencyResolver.validateDependenciesExist(
      taskId,
      dependsOn
    );

    if (!valid) {
      return res.status(400).json({
        message: "Invalid dependencies",
        invalidIds,
      });
    }

    // Validate no circular dependencies
    const noCycles = await DependencyResolver.validateNoCycles(taskId, dependsOn);

    if (!noCycles) {
      return res.status(400).json({
        message: "Cannot add dependency: would create circular dependency",
      });
    }

    // Check if all dependencies are complete to set initial status
    const { allowed, blockedBy } = await DependencyResolver.canComplete(taskId);

    // Update task with dependencies
    await taskRef.update({
      dependsOn,
      dependencyStatus: allowed ? "ready" : "blocked",
      blockedBy: blockedBy.map((b) => b.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      message: "Dependencies updated successfully",
      taskId,
      dependsOn,
      dependencyStatus: allowed ? "ready" : "blocked",
    });
  } catch (error) {
    console.error("Error updating task dependencies:", error);
    res.status(500).json({
      message: "Failed to update dependencies",
      error: error.message,
    });
  }
};

/**
 * Get dependency tree for a task
 * GET /api/tasks/:id/dependency-tree
 */
export const getTaskDependencyTree = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get task
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskDoc.data();
    const dependsOn = taskData.dependsOn || [];

    // Get dependency details
    const dependencies = [];
    for (const depId of dependsOn) {
      const depDoc = await db.collection("tasks").doc(depId).get();
      if (depDoc.exists) {
        const depData = depDoc.data();
        dependencies.push({
          id: depId,
          title: depData.title,
          status: depData.status,
          dependsOn: depData.dependsOn || [],
        });
      }
    }

    // Get tasks that depend on this task
    const blockedTasks = await DependencyResolver.getBlockedTasks(taskId);

    res.status(200).json({
      taskId,
      title: taskData.title,
      status: taskData.status,
      dependencies,
      blockedTasks: blockedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
      })),
    });
  } catch (error) {
    console.error("Error getting dependency tree:", error);
    res.status(500).json({
      message: "Failed to get dependency tree",
      error: error.message,
    });
  }
};

/**
 * Complete a task (with dependency checking)
 * POST /api/tasks/:id/complete
 */
export const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { uid, name, role, teamId } = req.user;

    // Get task
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskDoc.data();

    // Authorization: Only assigned member or leader can complete task
    if (role !== "leader" && taskData.assignedTo !== uid) {
      return res
        .status(403)
        .json({ message: "Only assigned member can complete this task" });
    }

    // Check dependencies
    const { allowed, blockedBy } = await DependencyResolver.canComplete(taskId);

    if (!allowed) {
      return res.status(400).json({
        message: "Cannot complete task: dependencies not met",
        blockedBy: blockedBy.map((b) => ({
          id: b.id,
          title: b.title,
          status: b.status,
        })),
      });
    }

    // Update task status to completed
    await taskRef.update({
      status: "completed",
      dependencyStatus: "completed",
      riskStatus: "none", // Clear risk status when completed
      isFrictionTask: false, // Clear friction status when completed
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update dependency statuses for tasks that depend on this one
    await DependencyResolver.updateDependencyStatuses(taskId);

    // Notify leader if member completes task
    if (role === "member") {
      const leaderId = taskData.createdBy;
      if (leaderId && leaderId !== uid) {
        await createNotification(
          leaderId,
          teamId,
          "TASK_COMPLETED",
          `${name || "A member"} completed task: ${taskData.title}`
        );
      }
    }

    res.status(200).json({
      message: "Task completed successfully",
      taskId,
      status: "completed",
    });
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({
      message: "Failed to complete task",
      error: error.message,
    });
  }
};


// ============================================
// RISK ASSESSMENT ENDPOINTS
// ============================================

import RiskAssessmentService from "../services/RiskAssessmentService.js";

/**
 * Get risk assessment for a specific task
 * GET /api/tasks/:id/risk-assessment
 */
export const getTaskRiskAssessment = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get task
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskDoc.data();
    const assessment = RiskAssessmentService.assessTaskRisk(task);

    res.status(200).json({
      taskId,
      title: task.title,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      status: task.status,
      ...assessment,
    });
  } catch (error) {
    console.error("Error getting task risk assessment:", error);
    res.status(500).json({
      message: "Failed to get risk assessment",
      error: error.message,
    });
  }
};

/**
 * Get all at-risk tasks for a team
 * GET /api/teams/:teamId/at-risk-tasks
 */
export const getAtRiskTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid } = req.user;

    // Verify team exists and user is a member
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();
    if (!teamData.members.includes(uid)) {
      return res.status(403).json({ message: "Not authorized to view this team's tasks" });
    }

    // Get at-risk tasks
    const atRiskTasks = await RiskAssessmentService.getAtRiskTasks(teamId);

    res.status(200).json({
      teamId,
      count: atRiskTasks.length,
      tasks: atRiskTasks,
    });
  } catch (error) {
    console.error("Error getting at-risk tasks:", error);
    res.status(500).json({
      message: "Failed to get at-risk tasks",
      error: error.message,
    });
  }
};

/**
 * Update risk status for a task (triggered by deadline/estimate changes)
 * PUT /api/tasks/:id/update-risk
 */
export const updateTaskRisk = async (req, res) => {
  try {
    const { taskId } = req.params;

    const assessment = await RiskAssessmentService.updateTaskRisk(taskId);

    res.status(200).json({
      message: "Risk status updated",
      taskId,
      ...assessment,
    });
  } catch (error) {
    console.error("Error updating task risk:", error);
    res.status(500).json({
      message: "Failed to update risk status",
      error: error.message,
    });
  }
};


// ============================================
// SKILL MATCHING ENDPOINTS
// ============================================

import SkillMatchingEngine from "../services/SkillMatchingEngine.js";

/**
 * Get suggested assignees for a task based on skills
 * GET /api/tasks/:id/suggested-assignees
 */
export const getSuggestedAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { uid, role } = req.user;

    // Get task
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskDoc.data();

    // Authorization: Only team members can view suggestions
    const teamDoc = await db.collection("teams").doc(taskData.teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this task's suggestions" });
    }

    // Get required skills from task
    const requiredSkills = taskData.requiredSkills || [];

    // Get suggested members
    const suggestions = await SkillMatchingEngine.suggestMembers(
      taskId,
      requiredSkills
    );

    res.status(200).json({
      taskId,
      taskTitle: taskData.title,
      requiredSkills,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error("Error getting suggested assignees:", error);
    res.status(500).json({
      message: "Failed to get suggested assignees",
      error: error.message,
    });
  }
};


// ============================================
// FRICTION TRACKING ENDPOINTS
// ============================================

/**
 * Get all friction tasks for a team (tasks reassigned more than 2 times)
 * GET /api/teams/:teamId/friction-tasks
 */
export const getFrictionTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { uid, role } = req.user;

    // Authorization: Only team members can view friction tasks
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();
    if (!teamData.members.includes(uid) && role !== "leader") {
      return res.status(403).json({ message: "Not authorized to view this team's tasks" });
    }

    // Query friction tasks
    const frictionTasksSnapshot = await db
      .collection("tasks")
      .where("teamId", "==", teamId)
      .where("isFrictionTask", "==", true)
      .get();

    const frictionTasks = [];
    frictionTasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      // Filter out completed tasks in application code
      if (taskData.status !== "completed" && taskData.status !== "Done") {
        frictionTasks.push({
          id: doc.id,
          ...taskData,
        });
      }
    });

    res.status(200).json({
      teamId,
      count: frictionTasks.length,
      tasks: frictionTasks,
    });
  } catch (error) {
    console.error("Error getting friction tasks:", error);
    res.status(500).json({
      message: "Failed to get friction tasks",
      error: error.message,
    });
  }
};

/**
 * Get reassignment history for a specific task
 * GET /api/tasks/:id/reassignment-history
 */
export const getReassignmentHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { uid } = req.user;

    // Get task
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskDoc.data();

    // Authorization: Only team members can view reassignment history
    const teamDoc = await db.collection("teams").doc(taskData.teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();
    if (!teamData.members.includes(uid)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this task's history" });
    }

    const reassignmentHistory = taskData.reassignmentHistory || [];
    const reassignmentCount = taskData.reassignmentCount || 0;
    const isFrictionTask = taskData.isFrictionTask || false;

    res.status(200).json({
      taskId,
      taskTitle: taskData.title,
      reassignmentCount,
      isFrictionTask,
      history: reassignmentHistory,
    });
  } catch (error) {
    console.error("Error getting reassignment history:", error);
    res.status(500).json({
      message: "Failed to get reassignment history",
      error: error.message,
    });
  }
};
