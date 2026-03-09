/**
 * Migration Script: Create Indexes for Mentor Features
 * 
 * This script creates database indexes for optimal query performance
 * on the new collections and fields.
 * 
 * Run with: node server/migrations/create_mentor_features_indexes.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import ActivityEvent from "../models/ActivityEvent.js";
import TeamHealthScore from "../models/TeamHealthScore.js";
import WeeklySummary from "../models/WeeklySummary.js";

dotenv.config({ path: "./server/.env" });

const createIndexes = async () => {
  try {
    console.log("🚀 Starting index creation for Mentor Features");
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Create indexes for ActivityEvent collection
    console.log("\n📋 Creating indexes for ActivityEvent collection...");
    await ActivityEvent.collection.createIndex({ teamId: 1, timestamp: -1 });
    await ActivityEvent.collection.createIndex({
      teamId: 1,
      eventType: 1,
      timestamp: -1,
    });
    await ActivityEvent.collection.createIndex({
      teamId: 1,
      userId: 1,
      timestamp: -1,
    });
    console.log("✅ ActivityEvent indexes created");

    // Create indexes for TeamHealthScore collection
    console.log("\n📊 Creating indexes for TeamHealthScore collection...");
    await TeamHealthScore.collection.createIndex({
      teamId: 1,
      calculatedAt: -1,
    });
    console.log("✅ TeamHealthScore indexes created");

    // Create indexes for WeeklySummary collection
    console.log("\n📝 Creating indexes for WeeklySummary collection...");
    await WeeklySummary.collection.createIndex({
      teamId: 1,
      weekStartDate: -1,
    });
    console.log("✅ WeeklySummary indexes created");

    console.log("\n✅ All indexes created successfully!");

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Index creation failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createIndexes();
