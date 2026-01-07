import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../models/User.js";

const listUsers = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        const users = await User.find({}, "name email role");
        console.log("Users in DB:");
        users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}] ID: ${u._id}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
