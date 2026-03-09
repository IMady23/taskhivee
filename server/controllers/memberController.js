/**
 * Member Controller
 * Handles member-specific operations including skill management
 */
import { db } from "../config/firebase.js";
import SkillMatchingEngine from "../services/SkillMatchingEngine.js";

/**
 * Update member skills
 * PUT /api/members/:memberId/skills
 */
export const updateMemberSkills = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { skills } = req.body;
    const { uid } = req.user;

    // Authorization: Only the member themselves can update their skills
    if (uid !== memberId) {
      return res
        .status(403)
        .json({ message: "You can only update your own skills" });
    }

    // Validate skills
    const validation = SkillMatchingEngine.validateSkills(skills);
    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
        invalidSkills: validation.invalidSkills,
        validSkills: SkillMatchingEngine.getValidSkills(),
      });
    }

    // Update member skills
    await db.collection("users").doc(memberId).update({
      skills,
      skillsUpdatedAt: new Date(),
    });

    res.status(200).json({
      message: "Skills updated successfully",
      memberId,
      skills,
    });
  } catch (error) {
    console.error("Error updating member skills:", error);
    res.status(500).json({
      message: "Failed to update skills",
      error: error.message,
    });
  }
};

/**
 * Get member skills
 * GET /api/members/:memberId/skills
 */
export const getMemberSkills = async (req, res) => {
  try {
    const { memberId } = req.params;

    const memberDoc = await db.collection("users").doc(memberId).get();

    if (!memberDoc.exists) {
      return res.status(404).json({ message: "Member not found" });
    }

    const memberData = memberDoc.data();

    res.status(200).json({
      memberId,
      memberName: memberData.name,
      skills: memberData.skills || [],
      skillsUpdatedAt: memberData.skillsUpdatedAt || null,
    });
  } catch (error) {
    console.error("Error getting member skills:", error);
    res.status(500).json({
      message: "Failed to get skills",
      error: error.message,
    });
  }
};

/**
 * Get valid skills list
 * GET /api/members/valid-skills
 */
export const getValidSkills = async (req, res) => {
  try {
    const validSkills = SkillMatchingEngine.getValidSkills();

    res.status(200).json({
      skills: validSkills,
    });
  } catch (error) {
    console.error("Error getting valid skills:", error);
    res.status(500).json({
      message: "Failed to get valid skills",
      error: error.message,
    });
  }
};
