/**
 * Task Model Extensions for Mentor Features
 * Adds new fields to support:
 * - Smart Task Dependencies
 * - Deadline Risk Prediction
 * - Member Skill Matching
 * - Conflict Resolution Tracking
 */
import mongoose from "mongoose";

// Extended Task Schema with new fields
const taskExtensionSchema = {
  // Smart Task Dependency fields
  dependsOn: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Task",
    default: [],
  },
  blockedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Task",
    default: [],
  },
  dependencyStatus: {
    type: String,
    enum: ["ready", "blocked", "completed"],
    default: "ready",
  },

  // Deadline Risk Prediction fields
  estimatedHours: {
    type: Number,
    default: null,
  },
  riskStatus: {
    type: String,
    enum: ["none", "at-risk", "critical"],
    default: "none",
  },
  riskCalculatedAt: {
    type: Date,
    default: null,
  },

  // Skill Matching fields
  requiredSkills: {
    type: [String],
    default: [],
  },

  // Conflict Resolution / Friction Tracking fields
  reassignmentCount: {
    type: Number,
    default: 0,
  },
  reassignmentHistory: [
    {
      fromMember: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      toMember: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reassignedAt: {
        type: Date,
        default: Date.now,
      },
      reason: {
        type: String,
        default: "",
      },
    },
  ],
  isFrictionTask: {
    type: Boolean,
    default: false,
  },
};

export default taskExtensionSchema;
