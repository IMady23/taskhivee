/**
 * Workload Calculator Service
 * Calculates member workload and heat levels for Firestore
 */
import { db } from "../config/firebase.js";

class WorkloadCalculator {
  /**
   * Calculate workload for a single member
   * @param {string} memberId - The member's user ID
   * @returns {Promise<{taskCount: number, heatLevel: string, tasks: Array}>}
   */
  async calculateWorkload(memberId) {
    try {
      // Query tasks assigned to this member with active statuses
      // Note: We need to query both assignedTo and assignedToUserId separately
      // because Firestore doesn't support OR queries directly
      
      const activeStatuses = ["To Do", "In Progress", "in-progress", "pending"];
      
      // Query 1: assignedTo field
      const tasksSnapshot1 = await db
        .collection("tasks")
        .where("assignedTo", "==", memberId)
        .get();

      // Query 2: assignedToUserId field
      const tasksSnapshot2 = await db
        .collection("tasks")
        .where("assignedToUserId", "==", memberId)
        .get();

      const tasks = [];
      const taskIds = new Set(); // To avoid duplicates

      // Process first query results
      tasksSnapshot1.forEach((doc) => {
        const taskData = doc.data();
        if (activeStatuses.includes(taskData.status) && !taskIds.has(doc.id)) {
          tasks.push({
            id: doc.id,
            ...taskData,
          });
          taskIds.add(doc.id);
        }
      });

      // Process second query results
      tasksSnapshot2.forEach((doc) => {
        const taskData = doc.data();
        if (activeStatuses.includes(taskData.status) && !taskIds.has(doc.id)) {
          tasks.push({
            id: doc.id,
            ...taskData,
          });
          taskIds.add(doc.id);
        }
      });

      const taskCount = tasks.length;
      const heatLevel = this.determineHeatLevel(taskCount);

      return {
        taskCount,
        heatLevel,
        tasks,
      };
    } catch (error) {
      console.error("Error calculating workload:", error);
      throw error;
    }
  }

  /**
   * Calculate workload for all team members
   * @param {string} teamId - The team ID
   * @returns {Promise<Map<string, Object>>} Map of memberId to workload data
   */
  async calculateTeamWorkload(teamId) {
    try {
      // Get team document to get member IDs
      const teamDoc = await db.collection("teams").doc(teamId).get();
      if (!teamDoc.exists) {
        throw new Error("Team not found");
      }

      const teamData = teamDoc.data();
      const memberIds = teamData.members || [];

      const workloadMap = new Map();

      // Calculate workload for each member
      for (const memberId of memberIds) {
        const memberDoc = await db.collection("users").doc(memberId).get();
        if (!memberDoc.exists) continue;

        const memberData = memberDoc.data();
        const workload = await this.calculateWorkload(memberId);

        workloadMap.set(memberId, {
          memberId,
          memberName: memberData.name || memberData.email,
          memberEmail: memberData.email,
          ...workload,
        });
      }

      return workloadMap;
    } catch (error) {
      console.error("Error calculating team workload:", error);
      throw error;
    }
  }

  /**
   * Determine heat level based on task count
   * @param {number} taskCount - Number of active tasks
   * @returns {string} Heat level: 'green', 'yellow', or 'red'
   */
  determineHeatLevel(taskCount) {
    if (taskCount >= 7) {
      return "red";
    } else if (taskCount >= 4) {
      return "yellow";
    } else {
      return "green";
    }
  }

  /**
   * Get heat level color code
   * @param {string} heatLevel - Heat level string
   * @returns {string} Emoji representation
   */
  getHeatLevelEmoji(heatLevel) {
    const emojiMap = {
      green: "🟢",
      yellow: "🟡",
      red: "🔴",
    };
    return emojiMap[heatLevel] || "⚪";
  }

  /**
   * Get workload summary for a team
   * @param {string} teamId - The team ID
   * @returns {Promise<Object>} Summary statistics
   */
  async getTeamWorkloadSummary(teamId) {
    try {
      const workloadMap = await this.calculateTeamWorkload(teamId);

      let greenCount = 0;
      let yellowCount = 0;
      let redCount = 0;
      let totalTasks = 0;

      workloadMap.forEach((workload) => {
        totalTasks += workload.taskCount;
        if (workload.heatLevel === "green") greenCount++;
        else if (workload.heatLevel === "yellow") yellowCount++;
        else if (workload.heatLevel === "red") redCount++;
      });

      return {
        totalMembers: workloadMap.size,
        greenCount,
        yellowCount,
        redCount,
        totalTasks,
        averageTasksPerMember:
          workloadMap.size > 0 ? (totalTasks / workloadMap.size).toFixed(1) : 0,
      };
    } catch (error) {
      console.error("Error getting team workload summary:", error);
      throw error;
    }
  }
}

export default new WorkloadCalculator();
