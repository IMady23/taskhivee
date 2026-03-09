/**
 * Team Health Score Model
 * Stores calculated team performance metrics
 */
import mongoose from "mongoose";

const teamHealthScoreSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    onTimeCompletionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reassignmentRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bugResolutionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    tasksSampled: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false }
);

// Compound index for historical queries
teamHealthScoreSchema.index({ teamId: 1, calculatedAt: -1 });

export default mongoose.model("TeamHealthScore", teamHealthScoreSchema);
