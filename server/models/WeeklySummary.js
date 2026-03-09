/**
 * Weekly Summary Model
 * Stores AI-generated weekly team summaries
 */
import mongoose from "mongoose";

const weeklySummarySchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    metrics: {
      tasksCompleted: { type: Number, default: 0 },
      tasksLate: { type: Number, default: 0 },
      reassignments: { type: Number, default: 0 },
      bugsResolved: { type: Number, default: 0 },
      bugsCreated: { type: Number, default: 0 },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: false }
);

// Index for querying summaries by team and date
weeklySummarySchema.index({ teamId: 1, weekStartDate: -1 });

export default mongoose.model("WeeklySummary", weeklySummarySchema);
