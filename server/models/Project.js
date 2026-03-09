/**
 * Project Model
 * Represents projects that group tasks together
 * Fields:
 *   - name: Project name
 *   - description: Project details
 *   - leader: Project owner (leader)
 *   - members: Array of team members on this project
 *   - status: Project status
 *   - startDate: Project start date
 *   - endDate: Project deadline
 *   - progress: Percentage complete
 */
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed"],
      default: "active",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
