/**
 * AI Summary Service
 * Generates natural language summaries of team performance using AI
 */
import { db } from "../config/firebase.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

class AISummaryService {
  /**
   * Collect weekly metrics for a team
   * @param {string} teamId - The team ID
   * @returns {Promise<Object>} Weekly metrics
   */
  async collectWeeklyMetrics(teamId) {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Tasks completed in the last 7 days
      const allTasksSnapshot = await db
        .collection("tasks")
        .where("teamId", "==", teamId)
        .get();

      let tasksCompleted = 0;
      let tasksLate = 0;

      allTasksSnapshot.forEach((doc) => {
        const task = doc.data();
        
        // Check if task is completed
        if (task.status === "completed" || task.status === "Done") {
          // Check if completed in last 7 days
          if (task.completedAt) {
            const completedDate = task.completedAt.toDate
              ? task.completedAt.toDate()
              : new Date(task.completedAt);
            
            if (completedDate >= weekAgo) {
              tasksCompleted++;
              
              // Check if it was late
              if (task.dueDate) {
                const dueDate = task.dueDate.toDate
                  ? task.dueDate.toDate()
                  : new Date(task.dueDate);
                if (completedDate > dueDate) {
                  tasksLate++;
                }
              }
            }
          }
        }
      });

      // Task reassignments in the last 7 days
      let reassignments = 0;
      allTasksSnapshot.forEach((doc) => {
        const task = doc.data();
        if (task.reassignmentHistory && Array.isArray(task.reassignmentHistory)) {
          const recentReassignments = task.reassignmentHistory.filter((r) => {
            const reassignedDate = r.reassignedAt.toDate
              ? r.reassignedAt.toDate()
              : new Date(r.reassignedAt);
            return reassignedDate >= weekAgo;
          });
          reassignments += recentReassignments.length;
        }
      });

      // Bugs resolved in the last 7 days
      // Fetch all bugs for the team and filter by status and resolvedAt in code
      const allBugsForResolvedSnapshot = await db
        .collection("bugs")
        .where("teamId", "==", teamId)
        .get();

      let bugsResolved = 0;
      allBugsForResolvedSnapshot.forEach((doc) => {
        const bug = doc.data();
        const status = bug.status;
        
        // Check if bug is resolved or closed
        if (status === "resolved" || status === "closed") {
          if (bug.resolvedAt) {
            const resolvedDate = bug.resolvedAt.toDate
              ? bug.resolvedAt.toDate()
              : new Date(bug.resolvedAt);
            if (resolvedDate >= weekAgo) {
              bugsResolved++;
            }
          }
        }
      });

      // Bugs created in the last 7 days
      const allBugsSnapshot = await db
        .collection("bugs")
        .where("teamId", "==", teamId)
        .get();

      let bugsCreated = 0;
      allBugsSnapshot.forEach((doc) => {
        const bug = doc.data();
        if (bug.createdAt) {
          const createdDate = bug.createdAt.toDate
            ? bug.createdAt.toDate()
            : new Date(bug.createdAt);
          if (createdDate >= weekAgo) {
            bugsCreated++;
          }
        }
      });

      return {
        tasksCompleted,
        tasksLate,
        reassignments,
        bugsResolved,
        bugsCreated,
        weekStartDate: weekAgo,
        weekEndDate: now,
      };
    } catch (error) {
      console.error("Error collecting weekly metrics:", error);
      throw error;
    }
  }

  /**
   * Generate summary using AI
   * @param {Object} metrics - Weekly metrics
   * @param {string} teamName - Team name
   * @returns {Promise<Object>} Generated summary
   */
  async generateSummary(metrics, teamName) {
    try {
      // Prepare prompt for AI
      const prompt = `Generate a professional weekly team performance summary for "${teamName}" based on these metrics:

- Tasks Completed: ${metrics.tasksCompleted}
- Tasks Completed Late: ${metrics.tasksLate}
- Task Reassignments: ${metrics.reassignments}
- Bugs Resolved: ${metrics.bugsResolved}
- New Bugs Created: ${metrics.bugsCreated}

Please provide:
1. A brief overview (2-3 sentences)
2. Key highlights (positive achievements)
3. Areas for improvement (if any)
4. Overall assessment

Keep it concise, professional, and actionable. Format it in a clear, readable way.`;

      // Try Groq API first
      let summary = null;
      let tokensUsed = 0;

      try {
        const groqResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a professional project management assistant. Generate clear, concise team performance summaries.",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 500,
            }),
          }
        );

        const groqData = await groqResponse.json();

        if (groqResponse.ok && groqData.choices?.[0]?.message?.content) {
          summary = groqData.choices[0].message.content;
          tokensUsed = groqData.usage?.total_tokens || 0;
        } else {
          console.warn("Groq API failed:", groqData.error);
        }
      } catch (error) {
        console.warn("Groq API error:", error.message);
      }

      // Fallback to formatted metrics if AI fails
      if (!summary) {
        summary = this.generateFallbackSummary(metrics, teamName);
      }

      return {
        summary,
        generatedAt: new Date(),
        tokensUsed,
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      // Return fallback summary
      return {
        summary: this.generateFallbackSummary(metrics, teamName),
        generatedAt: new Date(),
        tokensUsed: 0,
      };
    }
  }

  /**
   * Generate fallback summary without AI
   * @param {Object} metrics - Weekly metrics
   * @param {string} teamName - Team name
   * @returns {string} Formatted summary
   */
  generateFallbackSummary(metrics, teamName) {
    const onTimeRate =
      metrics.tasksCompleted > 0
        ? (
            ((metrics.tasksCompleted - metrics.tasksLate) /
              metrics.tasksCompleted) *
            100
          ).toFixed(0)
        : 0;

    return `📊 Weekly Summary for ${teamName}

**Overview:**
This week, the team completed ${metrics.tasksCompleted} task${metrics.tasksCompleted !== 1 ? "s" : ""} with an on-time completion rate of ${onTimeRate}%.

**Key Metrics:**
✅ Tasks Completed: ${metrics.tasksCompleted}
⏰ Tasks Completed Late: ${metrics.tasksLate}
🔄 Task Reassignments: ${metrics.reassignments}
🐛 Bugs Resolved: ${metrics.bugsResolved}
🆕 New Bugs: ${metrics.bugsCreated}

**Assessment:**
${metrics.tasksCompleted > 5 ? "Strong productivity this week! " : ""}${metrics.tasksLate > metrics.tasksCompleted / 2 ? "Consider reviewing task deadlines and estimates. " : ""}${metrics.reassignments > 3 ? "High reassignment rate may indicate workload imbalance. " : ""}${metrics.bugsResolved > metrics.bugsCreated ? "Excellent bug resolution rate! " : ""}

Generated: ${new Date().toLocaleDateString()}`;
  }

  /**
   * Store generated summary in Firestore
   * @param {string} teamId - The team ID
   * @param {Object} summaryData - Summary data
   * @param {string} generatedBy - User ID who generated it
   * @returns {Promise<string>} Document ID
   */
  async storeSummary(teamId, summaryData, generatedBy) {
    try {
      const weeklySummary = {
        teamId,
        weekStartDate: summaryData.metrics.weekStartDate,
        weekEndDate: summaryData.metrics.weekEndDate,
        summary: summaryData.summary,
        metrics: {
          tasksCompleted: summaryData.metrics.tasksCompleted,
          tasksLate: summaryData.metrics.tasksLate,
          reassignments: summaryData.metrics.reassignments,
          bugsResolved: summaryData.metrics.bugsResolved,
          bugsCreated: summaryData.metrics.bugsCreated,
        },
        generatedAt: new Date(),
        generatedBy,
      };

      const docRef = await db.collection("weekly_summaries").add(weeklySummary);

      console.log(`Stored weekly summary for team ${teamId}`);
      return docRef.id;
    } catch (error) {
      console.error("Error storing summary:", error);
      throw error;
    }
  }

  /**
   * Get historical summaries for a team
   * @param {string} teamId - The team ID
   * @param {number} limit - Number of summaries to retrieve
   * @returns {Promise<Array>} Array of summaries
   */
  async getSummaries(teamId, limit = 10) {
    try {
      const snapshot = await db
        .collection("weekly_summaries")
        .where("teamId", "==", teamId)
        .orderBy("weekStartDate", "desc")
        .limit(limit)
        .get();

      const summaries = [];
      snapshot.forEach((doc) => {
        summaries.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return summaries;
    } catch (error) {
      console.error("Error getting summaries:", error);
      throw error;
    }
  }
}

export default new AISummaryService();
