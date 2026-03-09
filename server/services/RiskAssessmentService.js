/**
 * Risk Assessment Service
 * Evaluates deadline risk for tasks in Firestore
 */
import { db } from "../config/firebase.js";

class RiskAssessmentService {
  /**
   * Assess risk for a single task
   * @param {Object} task - Task object with deadline and estimatedHours
   * @returns {Object} Risk assessment result
   */
  assessTaskRisk(task) {
    // If task is already completed, no risk
    if (task.status === "completed" || task.status === "Done") {
      return {
        isAtRisk: false,
        timeRemaining: null,
        estimatedTime: null,
        riskLevel: "none",
      };
    }

    // If no deadline or no estimated hours, cannot assess risk
    if (!task.dueDate || !task.estimatedHours) {
      return {
        isAtRisk: false,
        timeRemaining: null,
        estimatedTime: task.estimatedHours || null,
        riskLevel: "none",
      };
    }

    // Calculate time remaining
    const now = new Date();
    const deadline = new Date(task.dueDate);
    const timeRemainingMs = deadline - now;
    const timeRemainingHours = timeRemainingMs / (1000 * 60 * 60);

    // Determine risk level
    let riskLevel = "none";
    let isAtRisk = false;

    if (timeRemainingHours < 0) {
      // Past deadline
      riskLevel = "critical";
      isAtRisk = true;
    } else if (timeRemainingHours < task.estimatedHours) {
      // Not enough time to complete
      riskLevel = "at-risk";
      isAtRisk = true;
    }

    return {
      isAtRisk,
      timeRemaining: timeRemainingHours,
      estimatedTime: task.estimatedHours,
      riskLevel,
    };
  }

  /**
   * Run risk assessment for all active tasks in a team
   * @param {string} teamId - The team ID
   * @returns {Promise<void>}
   */
  async assessAllTasks(teamId) {
    try {
      // Get all active tasks for the team
      const tasksSnapshot = await db
        .collection("tasks")
        .where("teamId", "==", teamId)
        .where("status", "in", ["To Do", "In Progress", "in-progress", "pending"])
        .get();

      const batch = db.batch();
      let updatedCount = 0;

      tasksSnapshot.forEach((doc) => {
        const task = doc.data();
        const assessment = this.assessTaskRisk(task);

        // Update task with risk assessment
        batch.update(doc.ref, {
          riskStatus: assessment.riskLevel,
          riskCalculatedAt: new Date(),
        });

        updatedCount++;
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log(`Updated risk status for ${updatedCount} tasks in team ${teamId}`);
      }
    } catch (error) {
      console.error("Error assessing all tasks:", error);
      throw error;
    }
  }

  /**
   * Get all at-risk tasks for a team
   * @param {string} teamId - The team ID
   * @returns {Promise<Array>} Array of at-risk tasks
   */
  async getAtRiskTasks(teamId) {
    try {
      const tasksSnapshot = await db
        .collection("tasks")
        .where("teamId", "==", teamId)
        .where("riskStatus", "in", ["at-risk", "critical"])
        .get();

      const atRiskTasks = [];
      tasksSnapshot.forEach((doc) => {
        const task = doc.data();
        const assessment = this.assessTaskRisk(task);

        atRiskTasks.push({
          id: doc.id,
          ...task,
          riskAssessment: assessment,
        });
      });

      // Sort by risk level (critical first) and then by time remaining
      atRiskTasks.sort((a, b) => {
        if (a.riskAssessment.riskLevel === "critical" && b.riskAssessment.riskLevel !== "critical") {
          return -1;
        }
        if (a.riskAssessment.riskLevel !== "critical" && b.riskAssessment.riskLevel === "critical") {
          return 1;
        }
        return (a.riskAssessment.timeRemaining || 0) - (b.riskAssessment.timeRemaining || 0);
      });

      return atRiskTasks;
    } catch (error) {
      console.error("Error getting at-risk tasks:", error);
      throw error;
    }
  }

  /**
   * Update risk status for a specific task
   * @param {string} taskId - The task ID
   * @returns {Promise<Object>} Updated risk assessment
   */
  async updateTaskRisk(taskId) {
    try {
      const taskDoc = await db.collection("tasks").doc(taskId).get();

      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const task = taskDoc.data();
      const assessment = this.assessTaskRisk(task);

      // Update task with new risk status
      await taskDoc.ref.update({
        riskStatus: assessment.riskLevel,
        riskCalculatedAt: new Date(),
      });

      return assessment;
    } catch (error) {
      console.error("Error updating task risk:", error);
      throw error;
    }
  }
}

export default new RiskAssessmentService();
