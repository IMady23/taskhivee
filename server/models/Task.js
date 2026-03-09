/**
 * Task Model
 * Represents individual tasks assigned to members
 * Fields:
 *   - title: Task name
 *   - description: Detailed description
 *   - assignedTo: Member ID (user assigned the task)
 *   - createdBy: Leader ID (user who created the task)
 *   - status: Task progress status
 *   - priority: Task urgency level
 *   - dueDate: Deadline for completion
 *   - project: Associated project (optional)
 *   - comments: Array of task comments/updates
 *   - attachments: Array of file attachments
 */
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "on-hold"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    comments: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    // NEW: Smart Task Dependency fields
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

    // NEW: Deadline Risk Prediction fields
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

    // NEW: Skill Matching fields
    requiredSkills: {
      type: [String],
      default: [],
    },

    // NEW: Conflict Resolution / Friction Tracking fields
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
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
