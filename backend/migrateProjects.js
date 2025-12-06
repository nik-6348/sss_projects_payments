// Migration script to set default values for new Project fields
// Run this once after updating the Project model

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sss_projects";

async function migrateProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const projectsCollection = db.collection("projects");

    // Update all projects that don't have the new fields
    const result = await projectsCollection.updateMany(
      {
        $or: [
          { gst_percentage: { $exists: false } },
          { include_gst: { $exists: false } },
          { client_emails: { $exists: false } },
          { project_type: { $exists: false } },
        ],
      },
      {
        $set: {
          // GST Settings
          gst_percentage: 18,
          include_gst: true,
          // Multi-Email Support
          client_emails: {
            business_email: "",
            finance_email: "",
            support_email: "",
          },
          // Project Type
          project_type: "",
          contract_amount: 0,
          contract_length: 0,
          monthly_fee: 0,
          billing_cycle: "",
          hourly_rate: 0,
          estimated_hours: 0,
        },
      }
    );

    console.log(
      `Migration complete. Updated ${result.modifiedCount} projects.`
    );

    // Verify the update
    const projects = await projectsCollection.find({}).limit(5).toArray();
    console.log("\nSample updated projects:");
    projects.forEach((p) => {
      console.log(
        `- ${p.name}: GST ${p.gst_percentage}%, Type: ${
          p.project_type || "Not set"
        }`
      );
    });
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

migrateProjects();
