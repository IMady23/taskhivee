/**
 * Task Management Service
 * Handles all task-related operations with Firebase/Firestore
 * Used by Leader & Member Dashboards
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../config/firebase";
import { API_BASE_URL } from "../config";

/**
 * Subscribe to all tasks for a team (Real-time)
 */
export const subscribeToTeamTasks = (teamId, callback) => {
  if (!teamId) return () => { };

  try {
    const q = query(
      collection(db, "tasks"),
      where("teamId", "==", teamId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      callback(tasks);
    }, (error) => {
      console.error("❌ Error subscribing to team tasks:", error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Setup error for team tasks subscription:", error);
    return () => { };
  }
};

/**
 * Create a new task (Leader only)
 */
export const createTask = async (
  taskData,
  teamId,
  createdBy,
  assigneeInfo = null,
  leaderName = "",
  teamName = "",
  leaderPhotoURL = null
) => {
  try {
    // 1️⃣ Build task object
    const task = {
      title: taskData.title,
      description: taskData.description || "",
      assignedTo: taskData.assignedTo || null,
      assignedToUserId: assigneeInfo?.id || taskData.assignedTo || null,
      assignedToEmail: assigneeInfo?.email || null,
      assignedToName: assigneeInfo?.name || null,
      priority: taskData.priority || "Medium",
      status: "To Do",
      dueDate: taskData.dueDate || null,
      teamId,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };

    // 2️⃣ Save task to Firestore
    const docRef = await addDoc(collection(db, "tasks"), task);

    const createdTask = {
      id: docRef.id,
      ...task
    };

    // 3️⃣ Send notification to assignee
    if (assigneeInfo?.id && assigneeInfo.id !== createdBy) {
      try {
        const { notifyTaskAssigned } = await import("./notificationService");
        await notifyTaskAssigned(
          createdTask.id,
          task.title,
          assigneeInfo.id,
          assigneeInfo.name,
          leaderName || "Leader",
          teamId
        );
      } catch (notifError) {
        console.warn("⚠️ Task notification failed:", notifError);
      }
    }

    // 4️⃣ Send Task Assignment Email (ONLY if assignee exists)
    if (
      assigneeInfo?.email &&
      assigneeInfo?.name &&
      leaderName &&
      teamName
    ) {
      try {
        await fetch(`${API_BASE_URL}/email/task-assignment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assigneeEmail: assigneeInfo.email,
            assigneeName: assigneeInfo.name,
            leaderName,
            teamName,
            taskData: {
              title: taskData.title,
              priority: taskData.priority,
              dueDate: taskData.dueDate,
              description: taskData.description || ""
            }
          })
        });
      } catch (emailError) {
        console.warn("⚠️ Task email failed:", emailError);
      }
    }

    // 5️⃣ Log Activity (Leader side)
    try {
      const { logActivity } = await import("./activityService");
      await logActivity(
        teamId,
        "TASK_CREATED",
        `Task "${task.title}" created`,
        { id: createdBy, name: leaderName || "Leader", photoURL: leaderPhotoURL },
        { targetId: createdTask.id }
      );
    } catch (logError) {
      console.warn("⚠️ Activity log failed:", logError);
    }

    return createdTask;
  } catch (error) {
    console.error("❌ Error creating task:", error);
    throw new Error("Failed to create task");
  }
};

/**
 * Get all tasks for a team
 */
export const getTeamTasks = async (teamId) => {
  try {
    const q = query(
      collection(db, "tasks"),
      where("teamId", "==", teamId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("❌ Error fetching team tasks:", error);
    throw new Error("Failed to get tasks");
  }
};

/**
 * Update task (status / reassignment)
 */
export const updateTask = async (taskId, updates, performedBy = null) => {
  try {
    const taskRef = doc(db, "tasks", taskId);

    // If status is being changed to "Done", set completedAt timestamp
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    if (updates.status === "Done") {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(taskRef, updateData);

    const updatedSnap = await getDoc(taskRef);
    const updatedTask = {
      id: updatedSnap.id,
      ...updatedSnap.data()
    };

    // Activity Log
    try {
      const { logActivity } = await import("./activityService");

      let description = `Task "${updatedTask.title}" updated`;
      if (updates.status) {
        description = `Task "${updatedTask.title}" moved to ${updates.status}`;
      }

      await logActivity(
        updatedTask.teamId,
        "TASK_UPDATED",
        description,
        performedBy || { id: "user", name: "User" },
        { targetId: taskId }
      );
    } catch (logError) {
      console.warn("⚠️ Activity log failed:", logError);
    }

    return updatedTask;
  } catch (error) {
    console.error("❌ Error updating task:", error);
    throw new Error("Failed to update task");
  }
};

/**
 * Soft delete task
 */
export const deleteTask = async (taskId) => {
  try {
    await updateDoc(doc(db, "tasks", taskId), {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    throw new Error("Failed to delete task");
  }
};

/**
 * Subscribe to tasks assigned to a member (Real-time)
 * Uses the base teamId query and filters client-side to avoid complex composite index requirements
 */
export const subscribeToMemberTasks = (teamId, memberId, callback) => {
  if (!teamId || !memberId) return () => { };

  try {
    // Use the verified teamId + createdAt query
    const q = query(
      collection(db, "tasks"),
      where("teamId", "==", teamId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Filter client-side for active tasks assigned to this member
      const memberTasks = allTasks.filter(task =>
        task.isActive !== false &&
        (task.assignedTo === memberId || task.assignedToUserId === memberId)
      );

      callback(memberTasks);
    }, (error) => {
      console.error("❌ Error subscribing to member tasks:", error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Setup error for member tasks subscription:", error);
    return () => { };
  }
};

/**
 * Get tasks assigned to a member (One-time fetch)
 * Uses the base teamId query and filters client-side to avoid complex composite index requirements
 */
export const getMemberTasks = async (teamId, memberId) => {
  try {
    // Use the verified teamId + createdAt query
    const q = query(
      collection(db, "tasks"),
      where("teamId", "==", teamId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const allTasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter client-side for active tasks assigned to this member
    return allTasks.filter(task =>
      task.isActive !== false &&
      (task.assignedTo === memberId || task.assignedToUserId === memberId)
    );
  } catch (error) {
    console.error("❌ Error fetching member tasks:", error);
    throw new Error("Failed to get member tasks");
  }
};

/**
 * Task statistics for dashboard
 */
export const getTaskStats = async (teamId) => {
  try {
    const tasks = await getTeamTasks(teamId);
    const now = new Date();

    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "To Do").length,
      inProgress: tasks.filter(t => t.status === "In Progress").length,
      completed: tasks.filter(t => t.status === "Done").length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate.seconds * 1000);
        return due < now && t.status !== "Done";
      }).length
    };
  } catch (error) {
    console.error("❌ Error getting task stats:", error);
    return { total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 };
  }
};

/**
 * Add a comment to a task
 */
export const addTaskComment = async (taskId, commentData) => {
  try {
    const comment = {
      ...commentData,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `tasks/${taskId}/comments`), comment);

    return {
      id: docRef.id,
      ...comment,
      createdAt: { seconds: Date.now() / 1000 } // Optimistic update
    };
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw new Error("Failed to add comment");
  }
};

/**
 * Get comments for a task
 */
export const getTaskComments = async (taskId) => {
  try {
    const q = query(
      collection(db, `tasks/${taskId}/comments`),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    throw new Error("Failed to get comments");
  }
};
