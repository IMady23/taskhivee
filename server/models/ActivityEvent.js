/**
 * Activity Event Model
 * Tracks all team activities for timeline visualization
 */
import mongoose from "mongoose";

const activityEventSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true, // Denormalized for performance
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "task_assigned",
        "task_updated",
        "task_reassigned",
        "task_completed",
        "bug_created",
        "bug_resolved",
        "member_added",
        "member_removed",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["task", "bug", "member"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      required: true, // Denormalized for performance
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound indexes for efficient queries
activityEventSchema.index({ teamId: 1, timestamp: -1 });
activityEventSchema.index({ teamId: 1, eventType: 1, timestamp: -1 });
activityEventSchema.index({ teamId: 1, userId: 1, timestamp: -1 });

export default mongoose.model("ActivityEvent", activityEventSchema);
