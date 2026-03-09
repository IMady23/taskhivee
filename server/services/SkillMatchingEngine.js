/**
 * Skill Matching Engine Service
 * Ranks members by skill compatibility for task assignment
 */
import { db } from "../config/firebase.js";
import WorkloadCalculator from "./WorkloadCalculator.js";

class SkillMatchingEngine {
  // Predefined skill list
  static VALID_SKILLS = [
    "Frontend",
    "Backend",
    "UI",
    "Testing",
    "DevOps",
    "Database",
    "API",
    "Mobile",
  ];

  /**
   * Suggest members for a task based on skills
   * @param {string} taskId - The task ID
   * @param {Array<string>} requiredSkills - Required skills for the task
   * @returns {Promise<Array>} Ranked list of suggested members
   */
  async suggestMembers(taskId, requiredSkills = []) {
    try {
      // Get task to find team
      const taskDoc = await db.collection("tasks").doc(taskId).get();
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const task = taskDoc.data();
      const teamId = task.teamId;

      // Get all team members
      const membersSnapshot = await db
        .collection("users")
        .where("teamId", "==", teamId)
        .where("role", "==", "member")
        .get();

      const candidates = [];

      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const memberId = memberDoc.id;

        // Calculate skill match
        const matchScore = this.calculateMatchScore(
          memberData.skills || [],
          requiredSkills
        );

        // Get current workload
        const workload = await WorkloadCalculator.calculateWorkload(memberId);

        candidates.push({
          memberId,
          memberName: memberData.name,
          memberEmail: memberData.email,
          skills: memberData.skills || [],
          matchingSkills: this.getMatchingSkills(
            memberData.skills || [],
            requiredSkills
          ),
          matchPercentage: matchScore,
          currentWorkload: workload.taskCount,
          heatLevel: workload.heatLevel,
        });
      }

      // Rank members
      return this.rankMembers(candidates);
    } catch (error) {
      console.error("Error suggesting members:", error);
      throw error;
    }
  }

  /**
   * Calculate skill match score
   * @param {Array<string>} memberSkills - Member's skills
   * @param {Array<string>} requiredSkills - Required skills
   * @returns {number} Match percentage (0-100)
   */
  calculateMatchScore(memberSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return 0; // No requirements, no match score
    }

    const matchingSkills = memberSkills.filter((skill) =>
      requiredSkills.includes(skill)
    );

    return (matchingSkills.length / requiredSkills.length) * 100;
  }

  /**
   * Get matching skills between member and requirements
   * @param {Array<string>} memberSkills - Member's skills
   * @param {Array<string>} requiredSkills - Required skills
   * @returns {Array<string>} Matching skills
   */
  getMatchingSkills(memberSkills, requiredSkills) {
    return memberSkills.filter((skill) => requiredSkills.includes(skill));
  }

  /**
   * Rank members by combined skill match and workload
   * @param {Array} candidates - Array of candidate members
   * @returns {Array} Sorted array of members
   */
  rankMembers(candidates) {
    return candidates.sort((a, b) => {
      // First, sort by skill match (higher is better)
      if (a.matchPercentage !== b.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }

      // If skill match is equal, sort by workload (lower is better)
      return a.currentWorkload - b.currentWorkload;
    });
  }

  /**
   * Validate skill tags
   * @param {Array<string>} skills - Skills to validate
   * @returns {Object} Validation result
   */
  validateSkills(skills) {
    if (!Array.isArray(skills)) {
      return {
        valid: false,
        invalidSkills: [],
        message: "Skills must be an array",
      };
    }

    const invalidSkills = skills.filter(
      (skill) => !SkillMatchingEngine.VALID_SKILLS.includes(skill)
    );

    return {
      valid: invalidSkills.length === 0,
      invalidSkills,
      message:
        invalidSkills.length > 0
          ? `Invalid skills: ${invalidSkills.join(", ")}`
          : "All skills are valid",
    };
  }

  /**
   * Get valid skills list
   * @returns {Array<string>} List of valid skills
   */
  getValidSkills() {
    return SkillMatchingEngine.VALID_SKILLS;
  }
}

export default new SkillMatchingEngine();
