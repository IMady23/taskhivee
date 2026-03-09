/**
 * Dependency Resolver Service
 * Handles task dependency validation and management for Firestore
 */
import { db } from "../config/firebase.js";

class DependencyResolver {
  /**
   * Check if a task can be completed based on its dependencies
   * @param {string} taskId - The task ID to check
   * @returns {Promise<{allowed: boolean, blockedBy: Array}>}
   */
  async canComplete(taskId) {
    try {
      const taskDoc = await db.collection("tasks").doc(taskId).get();

      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const task = taskDoc.data();
      const dependsOn = task.dependsOn || [];

      // If no dependencies, task can be completed
      if (dependsOn.length === 0) {
        return { allowed: true, blockedBy: [] };
      }

      // Check each dependency
      const blockedBy = [];
      for (const depId of dependsOn) {
        const depDoc = await db.collection("tasks").doc(depId).get();

        if (depDoc.exists) {
          const depTask = depDoc.data();
          // Check if dependency is not completed
          if (depTask.status !== "completed") {
            blockedBy.push({
              id: depId,
              title: depTask.title,
              status: depTask.status,
            });
          }
        }
      }

      return {
        allowed: blockedBy.length === 0,
        blockedBy,
      };
    } catch (error) {
      console.error("Error in canComplete:", error);
      throw error;
    }
  }

  /**
   * Get all tasks that are blocked by a given task
   * @param {string} taskId - The task ID
   * @returns {Promise<Array>} Array of tasks that depend on this task
   */
  async getBlockedTasks(taskId) {
    try {
      const tasksSnapshot = await db
        .collection("tasks")
        .where("dependsOn", "array-contains", taskId)
        .get();

      const blockedTasks = [];
      tasksSnapshot.forEach((doc) => {
        blockedTasks.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return blockedTasks;
    } catch (error) {
      console.error("Error in getBlockedTasks:", error);
      throw error;
    }
  }

  /**
   * Validate that adding dependencies won't create a cycle
   * Uses depth-first search to detect cycles
   * @param {string} taskId - The task that will have dependencies added
   * @param {Array<string>} newDependencies - Array of task IDs to add as dependencies
   * @returns {boolean} True if no cycles detected, false otherwise
   */
  async validateNoCycles(taskId, newDependencies) {
    try {
      // Build dependency graph
      const visited = new Set();
      const recursionStack = new Set();

      const hasCycle = async (currentId) => {
        if (recursionStack.has(currentId)) {
          return true; // Cycle detected
        }

        if (visited.has(currentId)) {
          return false; // Already checked this path
        }

        visited.add(currentId);
        recursionStack.add(currentId);

        // Get dependencies of current task
        let dependencies = [];
        if (currentId === taskId) {
          // For the task we're updating, use the new dependencies
          dependencies = newDependencies;
        } else {
          const taskDoc = await db.collection("tasks").doc(currentId).get();
          if (taskDoc.exists) {
            dependencies = taskDoc.data().dependsOn || [];
          }
        }

        // Check each dependency
        for (const depId of dependencies) {
          if (await hasCycle(depId)) {
            return true;
          }
        }

        recursionStack.delete(currentId);
        return false;
      };

      return !(await hasCycle(taskId));
    } catch (error) {
      console.error("Error in validateNoCycles:", error);
      throw error;
    }
  }

  /**
   * Update dependency status for tasks affected by a completed task
   * @param {string} completedTaskId - The task that was just completed
   * @returns {Promise<void>}
   */
  async updateDependencyStatuses(completedTaskId) {
    try {
      // Find all tasks that depend on this completed task
      const blockedTasks = await this.getBlockedTasks(completedTaskId);

      // Update each blocked task's status
      const batch = db.batch();

      for (const task of blockedTasks) {
        // Check if all dependencies are now complete
        const { allowed } = await this.canComplete(task.id);

        const taskRef = db.collection("tasks").doc(task.id);
        batch.update(taskRef, {
          dependencyStatus: allowed ? "ready" : "blocked",
          blockedBy: allowed ? [] : task.dependsOn || [],
        });
      }

      await batch.commit();
      console.log(
        `Updated dependency statuses for ${blockedTasks.length} tasks`
      );
    } catch (error) {
      console.error("Error in updateDependencyStatuses:", error);
      throw error;
    }
  }

  /**
   * Validate that a task doesn't depend on itself
   * @param {string} taskId - The task ID
   * @param {Array<string>} dependencies - Array of dependency task IDs
   * @returns {boolean} True if valid, false if self-dependency detected
   */
  validateNoSelfDependency(taskId, dependencies) {
    return !dependencies.includes(taskId);
  }

  /**
   * Validate that all dependency tasks exist and belong to the same team
   * @param {string} taskId - The task ID
   * @param {Array<string>} dependencies - Array of dependency task IDs
   * @returns {Promise<{valid: boolean, invalidIds: Array}>}
   */
  async validateDependenciesExist(taskId, dependencies) {
    try {
      // Get the task's team
      const taskDoc = await db.collection("tasks").doc(taskId).get();
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const taskTeamId = taskDoc.data().teamId;
      const invalidIds = [];

      for (const depId of dependencies) {
        const depDoc = await db.collection("tasks").doc(depId).get();

        if (!depDoc.exists) {
          invalidIds.push({ id: depId, reason: "Task not found" });
        } else {
          const depTeamId = depDoc.data().teamId;
          if (depTeamId !== taskTeamId) {
            invalidIds.push({ id: depId, reason: "Task not in same team" });
          }
        }
      }

      return {
        valid: invalidIds.length === 0,
        invalidIds,
      };
    } catch (error) {
      console.error("Error in validateDependenciesExist:", error);
      throw error;
    }
  }
}

export default new DependencyResolver();
