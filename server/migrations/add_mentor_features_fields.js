/**
 * Migration Script: Add Mentor Features Fields
 * 
 * This script adds new fields to existing Task and User documents
 * with appropriate default values to support the 10 mentor features.
 * 
 * Run with: node server/migrations/add_mentor_features_fields.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "../models/Task.js";
import User from "../models/User.js";

dotenv.config({ path: "./server/.env" });

const runMigration = async () => {
  try {
    console.log("🚀 Starting migration: Add Mentor Features Fields");
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Migrate Task documents
    console.log("\n📋 Migrating Task documents...");
    const taskUpdateResult = await Task.updateMany(
      {
        $or: [
          { dependsOn: { $exists: false } },
          { blockedBy: { $exists: false } },
          { dependencyStatus: { $exists: false } },
          { estimatedHours: { $exists: false } },
          { riskStatus: { $exists: false } },
          { riskCalculatedAt: { $exists: false } },
          { requiredSkills: { $exists: false } },
          { reassignmentCount: { $exists: false } },
          { reassignmentHistory: { $exists: false } },
          { isFrictionTask: { $exists: false } },
        ],
      },
      {
        $set: {
          dependsOn: [],
          blockedBy: [],
          dependencyStatus: "ready",
          estimatedHours: null,
          riskStatus: "none",
          riskCalculatedAt: null,
          requiredSkills: [],
          reassignmentCount: 0,
          reassignmentHistory: [],
          isFrictionTask: false,
        },
      }
    );
    console.log(
      `✅ Updated ${taskUpdateResult.modifiedCount} Task documents`
    );

    // Migrate User documents
    console.log("\n👥 Migrating User documents...");
    const userUpdateResult = await User.updateMany(
      {
        $or: [
          { skills: { $exists: false } },
          { skillsUpdatedAt: { $exists: false } },
          { focusModeEnabled: { $exists: false } },
        ],
      },
      {
        $set: {
          skills: [],
          skillsUpdatedAt: null,
          focusModeEnabled: false,
        },
      }
    );
    console.log(
      `✅ Updated ${userUpdateResult.modifiedCount} User documents`
    );

    // Summary
    console.log("\n📊 Migration Summary:");
    console.log(`   Tasks updated: ${taskUpdateResult.modifiedCount}`);
    console.log(`   Users updated: ${userUpdateResult.modifiedCount}`);
    console.log("\n✅ Migration completed successfully!");

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runMigration();
