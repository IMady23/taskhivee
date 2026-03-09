import React, { createContext, useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import * as fs from '../services/firestoreService';

export const TasksContext = createContext();

const STORAGE_KEY = 'taskhive_leader_tasks_v1';

const sampleTasks = [
  {
    id: String(Date.now() - 50000),
    title: 'Design Login Page',
    description: 'Create responsive login UI',
    assignedTo: 'Karthikeya',
    priority: 'High',
    status: 'To Do',
    deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
  },
  {
    id: String(Date.now() - 40000),
    title: 'API Integration',
    description: 'Integrate auth API',
    assignedTo: 'Manaswini',
    priority: 'Medium',
    status: 'In Progress',
    deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
  },
  {
    id: String(Date.now() - 30000),
    title: 'Dashboard UI',
    description: 'Polish leader dashboard',
    assignedTo: 'Akshitha',
    priority: 'Low',
    status: 'Done',
    deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
  },
];

export function TasksProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Use correct teamId: user.teamId (for members/leaders) or user.uid (fallback for specific leader cases)
    const teamId = user?.teamId || user?.uid;

    if (!user || !teamId) {
      setTasks([]);
      return;
    }

    // Subscribe to Firestore tasks for the team
    const unsub = fs.onTasksByTeam(teamId, (arr) => {
      let filteredTasks = arr.map((t) => ({ id: t.id, ...t }));

      // Feature 4: Task Assignment Visibility
      // Members should only see tasks assigned to them (by ID)
      // Check both assignedTo and assignedToUserId for compatibility
      if (user?.role === 'member') {
        filteredTasks = filteredTasks.filter(t =>
          t.assignedTo === user.uid || t.assignedToUserId === user.uid
        );
      }

      setTasks(filteredTasks);
    });

    return () => unsub();
  }, [user]);

  // Actions call Firestore helpers. Real-time listener will update local state.
  // Actions call Firestore helpers
  const addTask = async (task) => {
    try {
      const teamId = user?.teamId || user?.uid || 'demo_team';
      const t = { ...task, teamId };
      const created = await fs.createTask(t);

      // Notify Assignee
      if (t.assignedTo && t.assignedTo !== 'Unassigned') {
        const { sendNotification } = await import('../services/notificationService');
        await sendNotification(
          t.assignedTo,
          teamId,
          'task_attention', // Yellow
          'New Task Assigned',
          `New task assigned: ${t.title}`
        );
      }

      const { logActivity } = await import('../services/activityService');
      await logActivity(
        teamId,
        'TASK_CREATED',
        `Task '${t.title}' created by ${user.name || 'Member'}`,
        { id: user.uid, name: user.name || 'Member', photoURL: user.photoURL },
        { targetId: created?.id || t.id, targetType: 'TASK' }
      );

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('createTask error', e);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const prev = tasks.find(t => t.id === id);
      const safeUpdates = { ...updates };

      // Guard: members can't directly mark tasks Done; they must go through Review.
      if (user?.role === 'member' && safeUpdates.status === 'Done') {
        safeUpdates.status = 'Review';
      }

      await fs.updateTask(id, safeUpdates);

      const { sendNotification } = await import('../services/notificationService');
      const teamId = user?.teamId || user?.uid;

      // 1. Notify Leader if Status -> Review / Done / In Progress
      if ((safeUpdates.status === 'Review' || safeUpdates.status === 'Done' || safeUpdates.status === 'In Progress') && safeUpdates.status !== prev?.status) {
        // Find leader(s) - FIX: Use getUsersByTeam to get user objects with roles
        const members = await fs.getUsersByTeam(teamId);
        const leaders = members.filter(m => m.role === 'leader');
        for (const leader of leaders) {
          // Don't notify self if leader updated their own task
          const leaderId = leader.id || leader.uid;
          if (leaderId !== user.uid) {
            const verb =
              safeUpdates.status === 'Done'
                ? 'Completed'
                : safeUpdates.status === 'Review'
                  ? 'Submitted for Review'
                  : 'Started';
            await sendNotification(
              leaderId,
              teamId,
              safeUpdates.status === 'Done' ? 'task_success' : 'task_attention',
              safeUpdates.status === 'Review' ? 'Task Needs Review' : `Task ${verb}`,
              safeUpdates.status === 'Review'
                ? `${user.name || 'A member'} submitted ‘${prev.title}’ for review`
                : `${user.name || 'A member'} ${verb.toLowerCase()} ‘${prev.title}’`
            );
          }
        }
      }

      // 2. Notify Assignee if Status Changed (and not done by themselves)
      // OR if Assigned user changed (Re-assignment)
      if (prev && (safeUpdates.assignedTo || safeUpdates.status)) {
        // If re-assigned, notify NEW assignee
        if (safeUpdates.assignedTo && safeUpdates.assignedTo !== prev.assignedTo) {
          const newAssigneeId = prev.assignedToUserId || safeUpdates.assignedTo;
          await sendNotification(
            newAssigneeId, // Prefer UID when available
            teamId,
            'TASK_ASSIGNED',
            `You have been assigned to task: "${prev.title}"`,
            { taskId: id }
          );
        } else {
          // Status update - notify current assignee
          const assigneeId = prev.assignedToUserId || prev.assignedTo;
          if (assigneeId && assigneeId !== 'Unassigned' && assigneeId !== user.uid) {
            let msg = '';
            if (safeUpdates.status && safeUpdates.status !== prev.status) {
              msg = `Task "${prev.title}" status updated to ${safeUpdates.status}`;
            }

            if (msg) {
              await sendNotification(
                assigneeId,
                teamId,
                'task_attention', // Yellow
                'Task Status Updated',
                `Task ‘${prev.title}’ moved to ${safeUpdates.status}`
              );
            }
          }
        }
      }

      // Log Activity
      const { logActivity } = await import('../services/activityService');
      let description = `Task "${prev?.title || 'Unknown'}" updated`;
      if (safeUpdates.status) {
        description = `Task "${prev?.title || 'Unknown'}" moved to ${safeUpdates.status}`;
      }
      await logActivity(
        teamId,
        'TASK_UPDATED',
        description,
        { id: user.uid, name: user.name || 'Member', photoURL: user.photoURL },
        { targetId: id, targetType: 'TASK' }
      );

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('updateTask error', e);
    }
  };

  const requestReassignment = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const teamId = user?.teamId || user?.uid;
      const updates = {
        status: 'Reassignment Requested',
        reassignmentRequestedBy: user.uid,
        reassignmentRequestedAt: new Date().toISOString()
      };

      await fs.updateTask(taskId, updates);

      // Log Activity
      const { logActivity } = await import('../services/activityService');
      await logActivity(
        teamId,
        'TASK_REASSIGNMENT_REQUESTED',
        `${user.name || 'Member'} requested reassignment for task: "${task.title}"`,
        { id: user.uid, name: user.name || 'Member', photoURL: user.photoURL },
        { targetId: taskId, targetType: 'TASK' }
      );

      // Notify Leaders
      const { sendNotification } = await import('../services/notificationService');
      const members = await fs.getUsersByTeam(teamId);
      const leaders = members.filter(m => m.role === 'leader');

      for (const leader of leaders) {
        const leaderId = leader.id || leader.uid;
        await sendNotification(
          leaderId,
          teamId,
          'task_attention',
          'Reassignment Requested',
          `${user.name || 'A member'} requested reassignment for ‘${task.title}’`
        );
      }

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('requestReassignment error', e);
    }
  };

  const reassignTask = async (taskId, newAssigneeId, newAssigneeName, newDueDate) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const teamId = user?.teamId || user?.uid;
      const oldAssigneeId = task.assignedTo;
      const oldAssigneeName = task.assignedToName || 'Previous member';

      const updates = {
        assignedTo: newAssigneeId,
        assignedToName: newAssigneeName,
        dueDate: newDueDate,
        status: 'To Do',
        reassignedFrom: oldAssigneeId,
        reassignedAt: new Date().toISOString()
      };

      await fs.updateTask(taskId, updates);

      // Log Activity
      const { logActivity } = await import('../services/activityService');
      await logActivity(
        teamId,
        'TASK_REASSIGNED',
        `Task "${task.title}" reassigned from ${oldAssigneeName} to ${newAssigneeName}`,
        { id: user.uid, name: user.name || 'Leader', photoURL: user.photoURL },
        { targetId: taskId, targetType: 'TASK' }
      );

      // Notify New Member
      const { sendNotification } = await import('../services/notificationService');
      await sendNotification(
        newAssigneeId,
        teamId,
        'TASK_ASSIGNED',
        `You have been assigned a task previously owned by ${oldAssigneeName}`,
        { taskId: taskId }
      );

      // Notify Old Member
      if (oldAssigneeId && oldAssigneeId !== 'Unassigned') {
        await sendNotification(
          oldAssigneeId,
          teamId,
          'task_success',
          'Task Reassigned',
          `Task ‘${task.title}’ reassigned successfully`
        );
      }

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('reassignTask error', e);
    }
  };

  const setTaskReminder = async (taskId, type) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates = {
        reminder: {
          type,
          setBy: user.uid,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        }
      };

      await fs.updateTask(taskId, updates);
      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('setTaskReminder error', e);
    }
  };

  const sendTaskReminder = async (taskId, includeEmail = false) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const teamId = user?.teamId || user?.uid;
      const { sendNotification } = await import('../services/notificationService');

      // 1. Create in-app notification for member
      const reminderPrefix = '⏰ Reminder';
      const reminderMsg = task.reminder?.type === 'OVERDUE'
        ? `Task “${task.title}” is overdue.`
        : `Task “${task.title}” is nearing its deadline.`;

      const fullMsg = `${reminderPrefix}: ${reminderMsg}`;

      await sendNotification(
        task.assignedTo,
        teamId,
        'task_attention',
        fullMsg, // Use as title for Banner visibility
        reminderMsg,
        { taskId }
      );

      // 2. Optional Email escalation (only for overdue and if requested)
      if (includeEmail && task.reminder?.type === 'OVERDUE') {
        // Here we would call an email service if available.
        // For now, we'll log it as per requirements.
        console.log(`[Email Reminder] Sent to ${task.assignedToName} for task: ${task.title}`);
      }

      // 3. Mark as sent
      const updates = {
        'reminder.status': 'sent',
        'reminder.sentAt': new Date().toISOString()
      };

      await fs.updateTask(taskId, updates);
      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('sendTaskReminder error', e);
    }
  };

  /**
   * Helper: Add entry to reassignment history audit trail
   */
  const addToReassignmentHistory = async (taskId, entry) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const history = task.reassignmentHistory || [];
      history.push({
        ...entry,
        performedBy: user.uid,
        performedByName: user.name || 'Leader',
        at: new Date().toISOString()
      });

      await fs.updateTask(taskId, {
        reassignmentHistory: history
      });
    } catch (e) {
      console.error('addToReassignmentHistory error', e);
    }
  };

  /**
   * Keep Same Member - Option 1
   * Reset status to "In Progress" with reason
   */
  const keepSameMember = async (taskId, reason) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const teamId = user?.teamId || user?.uid;

      // Update task status
      await fs.updateTask(taskId, {
        status: 'In Progress'
      });

      // Add to audit trail
      await addToReassignmentHistory(taskId, {
        action: 'kept',
        reason,
        previousStatus: task.status
      });

      // Log Activity
      const { logActivity } = await import('../services/activityService');
      await logActivity(
        teamId,
        'TASK_REASSIGNMENT_KEPT',
        `Leader decided to keep "${task.title}" with ${task.assignedToName || 'member'}. Reason: ${reason}`,
        { id: user.uid, name: user.name || 'Leader', photoURL: user.photoURL },
        { targetId: taskId, targetType: 'TASK' }
      );

      // Notify Member
      const { sendNotification } = await import('../services/notificationService');
      await sendNotification(
        task.assignedTo,
        teamId,
        'task_attention',
        'Task Reassignment Decision',
        `Leader decided to keep you on task "${task.title}". Reason: ${reason}`
      );

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('keepSameMember error', e);
    }
  };

  /**
   * Reassign to Same Member with New Deadline - Option 2
   */
  const reassignToSameMemberNewDeadline = async (taskId, newDueDate, reason) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const teamId = user?.teamId || user?.uid;
      const oldDeadline = task.dueDate || task.deadline;

      // Update task
      await fs.updateTask(taskId, {
        dueDate: newDueDate,
        status: 'To Do',
        reassignedAt: new Date().toISOString()
      });

      // Add to audit trail
      await addToReassignmentHistory(taskId, {
        action: 'deadline_extended',
        oldDeadline,
        newDeadline: newDueDate,
        reason
      });

      // Log Activity
      const { logActivity } = await import('../services/activityService');
      await logActivity(
        teamId,
        'TASK_DEADLINE_EXTENDED',
        `Deadline extended for "${task.title}" assigned to ${task.assignedToName || 'member'}. Reason: ${reason}`,
        { id: user.uid, name: user.name || 'Leader', photoURL: user.photoURL },
        { targetId: taskId, targetType: 'TASK' }
      );

      // Notify Member
      const { sendNotification } = await import('../services/notificationService');
      await sendNotification(
        task.assignedTo,
        teamId,
        'task_attention',
        'Task Deadline Extended',
        `Your deadline for "${task.title}" has been extended. New deadline: ${new Date(newDueDate).toLocaleDateString()}. Reason: ${reason}`
      );

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('reassignToSameMemberNewDeadline error', e);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fs.deleteTaskById(id);
      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('deleteTask error', e);
    }
  };

  return (
    <TasksContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      deleteTask,
      requestReassignment,
      reassignTask,
      keepSameMember,
      reassignToSameMemberNewDeadline,
      setTaskReminder,
      sendTaskReminder
    }}>

      {children}
    </TasksContext.Provider>
  );
}

export default TasksContext;
