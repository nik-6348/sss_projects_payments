import mongoose from "mongoose";
import env from "./env.js";

// Connection options for better stability
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  heartbeatFrequencyMS: 10000, // Check connection every 10s
  maxPoolSize: 10, // Maximum number of connections
  minPoolSize: 2, // Minimum number of connections
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4
};

let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, connectionOptions);
    isConnected = true;
    reconnectAttempts = 0;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    handleConnectionError();
  }
};

// Handle connection errors and attempt reconnection
const handleConnectionError = () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    const delay = Math.min(5000 * reconnectAttempts, 30000); // Exponential backoff, max 30s
    console.log(
      `🔄 Attempting to reconnect in ${
        delay / 1000
      }s... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
    );
    setTimeout(connectDB, delay);
  } else {
    console.error(
      "❌ Max reconnection attempts reached. Please check MongoDB connection."
    );
  }
};

// ==========================================
// CONNECTION EVENT LISTENERS
// ==========================================

mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("🟢 MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("🟡 MongoDB disconnected");
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    handleConnectionError();
  }
});

mongoose.connection.on("error", (error) => {
  console.error("🔴 MongoDB connection error:", error.message);
  isConnected = false;
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  reconnectAttempts = 0;
  console.log("🟢 MongoDB reconnected successfully");
});

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("📴 MongoDB connection closed through app termination");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
});

// Export connection status checker
export const getConnectionStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host,
});

export default connectDB;
