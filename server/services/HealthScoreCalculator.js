/**
 * Health Score Calculator Service
 * Calculates team performance metrics for Firestore
 */
import { db } from "../config/firebase.js";

class HealthScoreCalculator {
  /**
   * Calculate on-time completion rate
   * @param {string} teamId - The team ID
   * @param {Object} dateRange - Optional date range {start, end}
   * @returns {Promise<number>} Percentage (0-100)
   */
  async calculateOnTimeRate(teamId, dateRange = null) {
    try {
      let query = db
        .collection("tasks")
        .where("teamId", "==", teamId);

      const allTasksSnapshot = await query.get();

      if (allTasksSnapshot.empty) {
        return 100; // No tasks = perfect score
      }

      let onTimeCount = 0;
      let totalCompletedCount = 0;

      allTasksSnapshot.forEach((doc) => {
        const task = doc.data();
        
        // Check if task is completed (Done or completed status)
        if (task.status === "Done" || task.status === "completed") {
          totalCompletedCount++;

          // Check if task was completed on time
          if (task.dueDate && task.completedAt) {
            const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
            const completedDate = task.completedAt.toDate
              ? task.completedAt.toDate()
              : new Date(task.completedAt);

            if (completedDate <= dueDate) {
              onTimeCount++;
            }
          } else {
            // If no due date, consider it on time
            onTimeCount++;
          }
        }
      });

      return totalCompletedCount > 0 ? (onTimeCount / totalCompletedCount) * 100 : 100;
    } catch (error) {
      console.error("Error calculating on-time rate:", error);
      throw error;
    }
  }

  /**
   * Calculate reassignment rate
   * @param {string} teamId - The team ID
   * @param {Object} dateRange - Optional date range
   * @returns {Promise<number>} Percentage (0-100)
   */
  async calculateReassignmentRate(teamId, dateRange = null) {
    try {
      let query = db.collection("tasks").where("teamId", "==", teamId);

      // Apply date range if provided
      if (dateRange && dateRange.start) {
        query = query.where("createdAt", ">=", dateRange.start);
      }

      const tasksSnapshot = await query.get();

      if (tasksSnapshot.empty) {
        return 0;
      }

      let reassignedCount = 0;
      let totalCount = tasksSnapshot.size;

      tasksSnapshot.forEach((doc) => {
        const task = doc.data();
        if (task.reassignmentCount && task.reassignmentCount > 0) {
          reassignedCount++;
        }
      });

      // Lower reassignment rate is better, so we invert it
      const reassignmentPercentage = (reassignedCount / totalCount) * 100;
      return Math.max(0, 100 - reassignmentPercentage);
    } catch (error) {
      console.error("Error calculating reassignment rate:", error);
      throw error;
    }
  }

  /**
   * Calculate bug resolution rate
   * @param {string} teamId - The team ID
   * @param {Object} dateRange - Optional date range
   * @returns {Promise<number>} Percentage (0-100)
   */
  async calculateBugResolutionRate(teamId, dateRange = null) {
    try {
      let query = db.collection("bugs").where("teamId", "==", teamId);

      // Apply date range if provided
      if (dateRange && dateRange.start) {
        query = query.where("createdAt", ">=", dateRange.start);
      }

      const bugsSnapshot = await query.get();

      if (bugsSnapshot.empty) {
        return 100; // No bugs is good!
      }

      let resolvedCount = 0;
      let totalCount = bugsSnapshot.size;

      bugsSnapshot.forEach((doc) => {
        const bug = doc.data();
        if (bug.status === "resolved" || bug.status === "closed") {
          resolvedCount++;
        }
      });

      return (resolvedCount / totalCount) * 100;
    } catch (error) {
      console.error("Error calculating bug resolution rate:", error);
      throw error;
    }
  }

  /**
   * Calculate overall health score
   * @param {string} teamId - The team ID
   * @param {Object} dateRange - Optional date range {start, end}
   * @returns {Promise<Object>} Health score data
   */
  async calculateHealthScore(teamId, dateRange = null) {
    try {
      // Calculate individual metrics
      const onTimeCompletionRate = await this.calculateOnTimeRate(
        teamId,
        dateRange
      );
      const reassignmentRate = await this.calculateReassignmentRate(
        teamId,
        dateRange
      );
      const bugResolutionRate = await this.calculateBugResolutionRate(
        teamId,
        dateRange
      );

      // Weighted average (can be adjusted)
      const weights = {
        onTime: 0.4,
        reassignment: 0.3,
        bugResolution: 0.3,
      };

      const score =
        onTimeCompletionRate * weights.onTime +
        reassignmentRate * weights.reassignment +
        bugResolutionRate * weights.bugResolution;

      // Determine trend (compare with previous period)
      let trend = "stable";
      if (dateRange) {
        const previousPeriodStart = new Date(dateRange.start);
        previousPeriodStart.setDate(
          previousPeriodStart.getDate() -
            (dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)
        );

        const previousScore = await this.calculateHealthScore(teamId, {
          start: previousPeriodStart,
          end: dateRange.start,
        });

        if (score > previousScore.score + 5) {
          trend = "improving";
        } else if (score < previousScore.score - 5) {
          trend = "declining";
        }
      }

      return {
        score: Math.round(score * 10) / 10, // Round to 1 decimal
        onTimeCompletionRate: Math.round(onTimeCompletionRate * 10) / 10,
        reassignmentRate: Math.round(reassignmentRate * 10) / 10,
        bugResolutionRate: Math.round(bugResolutionRate * 10) / 10,
        trend,
      };
    } catch (error) {
      console.error("Error calculating health score:", error);
      throw error;
    }
  }

  /**
   * Store health score in Firestore
   * @param {string} teamId - The team ID
   * @param {Object} scoreData - Health score data
   * @returns {Promise<string>} Document ID
   */
  async storeHealthScore(teamId, scoreData) {
    try {
      // Count tasks sampled
      const tasksSnapshot = await db
        .collection("tasks")
        .where("teamId", "==", teamId)
        .get();

      const healthScoreData = {
        teamId,
        score: scoreData.score,
        onTimeCompletionRate: scoreData.onTimeCompletionRate,
        reassignmentRate: scoreData.reassignmentRate,
        bugResolutionRate: scoreData.bugResolutionRate,
        calculatedAt: new Date(),
        tasksSampled: tasksSnapshot.size,
      };

      const docRef = await db
        .collection("team_health_scores")
        .add(healthScoreData);

      console.log(`Stored health score for team ${teamId}: ${scoreData.score}`);
      return docRef.id;
    } catch (error) {
      console.error("Error storing health score:", error);
      throw error;
    }
  }

  /**
   * Get health score color based on value
   * @param {number} score - Health score (0-100)
   * @returns {string} Color name
   */
  getScoreColor(score) {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  }

  /**
   * Get historical health scores
   * @param {string} teamId - The team ID
   * @param {number} limit - Number of records to retrieve
   * @returns {Promise<Array>} Array of health scores
   */
  async getHealthHistory(teamId, limit = 30) {
    try {
      const snapshot = await db
        .collection("team_health_scores")
        .where("teamId", "==", teamId)
        .orderBy("calculatedAt", "desc")
        .limit(limit)
        .get();

      const history = [];
      snapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return history.reverse(); // Oldest first for charting
    } catch (error) {
      console.error("Error getting health history:", error);
      throw error;
    }
  }
}

export default new HealthScoreCalculator();
