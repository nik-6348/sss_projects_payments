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
import emailRoutes from "./routes/emailRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import User from "./models/User.js";

const app = express();
const PORT = env.PORT;

// ==========================================
// GLOBAL ERROR HANDLERS - Prevent silent crashes
// ==========================================

process.on("uncaughtException", (error) => {
  console.error("🔴 UNCAUGHT EXCEPTION:", error.message);
  console.error(error.stack);
  // Keep server running but log the error
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  // Keep server running but log the error
});

// ==========================================
// CORS CONFIGURATION - Fixed for proper credentials handling
// ==========================================

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured client URL and localhost variants
    const allowedOrigins = [
      env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // Cache preflight for 24 hours
};

// Apply CORS FIRST before any other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ==========================================
// RATE LIMITING - Increased for development
// ==========================================

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS, // 1000 requests per window
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS", // Skip preflight requests
});

app.use(limiter);

// ==========================================
// BODY PARSING MIDDLEWARE
// ==========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// DATABASE CONNECTION
// ==========================================

connectDB();

// ==========================================
// CREATE TEST USER (Development Only)
// ==========================================

const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ email: "admin@singaji.in" });
    if (!existingUser) {
      await User.create({
        name: "Admin",
        email: "admin@singaji.in",
        password: "Singaji@123",
        role: "admin",
      });
      console.log("✅ Test user created: admin@singaji.in / Singaji@123");
    }
  } catch (error) {
    console.error("Error creating test user:", error);
  }
};

if (env.NODE_ENV !== "production") {
  createTestUser();
}

// ==========================================
// SCHEDULED TASKS
// ==========================================

// Schedule Overdue Invoice Check: Runs every day at 10:00 AM
cron.schedule(
  "0 10 * * *",
  () => {
    console.log("📋 Running scheduled overdue invoice check...");
    checkOverdueInvoices();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Payment Dashboard API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

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

// API Routes
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

// ==========================================
// ERROR HANDLING
// ==========================================

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📍 Environment: ${env.NODE_ENV}
🔗 Client URL: ${env.CLIENT_URL}
⏰ Started at: ${new Date().toISOString()}
  `);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const gracefulShutdown = (signal) => {
  console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(
      "⚠️ Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
