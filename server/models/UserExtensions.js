/**
 * User Model Extensions for Mentor Features
 * Adds new fields to support:
 * - Member Skill Tags
 * - Focus Mode preferences
 */
import mongoose from "mongoose";

// Extended User Schema with new fields
const userExtensionSchema = {
  // Member Skill Tags
  skills: {
    type: [String],
    enum: [
      "Frontend",
      "Backend",
      "UI",
      "Testing",
      "DevOps",
      "Database",
      "API",
      "Mobile",
    ],
    default: [],
  },
  skillsUpdatedAt: {
    type: Date,
    default: null,
  },

  // Focus Mode preference
  focusModeEnabled: {
    type: Boolean,
    default: false,
  },
};

export default userExtensionSchema;
