import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../models/User.js";
import Project from "../models/Project.js";

const reassignData = async () => {
    try {
        console.log("🌱 Connecting to database...");
        await mongoose.connect(env.MONGO_URI);
        console.log("✅ Database connected.");

        // 1. Find the target User
        const targetEmail = "nikhil@singaji.in"; // Hardcoded for fix
        const user = await User.findOne({ email: new RegExp(targetEmail, 'i') });

        if (!user) {
            console.error(`❌ User with email ${targetEmail} not found.`);
            // Fallback: List users to see what's available
            const users = await User.find({}, "name email");
            console.log("Available users:", users.map(u => `${u.name} (${u.email})`).join(", "));
            process.exit(1);
        }
        console.log(`👤 Reassigning to User: ${user.name} (${user.email})`);

        // 2. Update all Projects
        const result = await Project.updateMany({}, { user_id: user._id });
        console.log(`✅ Updated ${result.modifiedCount} projects to user ${user.name}.`);

        console.log("✨ Reassignment completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error reassigning data:", error);
        process.exit(1);
    }
};

reassignData();
