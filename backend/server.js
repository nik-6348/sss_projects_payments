import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import projectRoutes from "./routes/projectRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import invoicePDFRoutes from "./routes/invoicePDFRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import bankDetailsRoutes from "./routes/bankDetailsRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import connectDB from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";
import env from "./config/env.js";
import { checkOverdueInvoices } from "./checkOverdueInvoices.js";

const app = express();
const PORT = env.PORT || 5000;

// Schedule Overdue Invoice Check: Runs every day at 10:00 AM
cron.schedule(
  "0 10 * * *",
  () => {
    console.log("Running scheduled overdue invoice check...");
    checkOverdueInvoices();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// Test Route for Overdue Invoices (Manual Trigger)
app.get("/api/test-cron", async (req, res) => {
  try {
    console.log("Manual trigger: Checking overdue invoices...");
    await checkOverdueInvoices();
    res.json({
      success: true,
      message: "Overdue check completed. Check server logs for details.",
    });
  } catch (error) {
    console.error("Manual trigger error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Create test user if it doesn't exist (for development)
import User from "./models/User.js";
const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (!existingUser) {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "admin",
      });
      console.log("Test user created: test@example.com / password123");
    }
  } catch (error) {
    console.error("Error creating test user:", error);
  }
};

// Create test user in development
if (env.NODE_ENV !== "production") {
  createTestUser();
}

import emailRoutes from "./routes/emailRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoicePDFRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/bank-accounts", bankDetailsRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Payment Dashboard API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
