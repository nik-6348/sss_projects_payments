import env from "../config/env.js";

/**
 * Global error handler middleware
 * Ensures all errors return proper responses with CORS headers
 */
const errorHandler = (err, req, res, next) => {
  // Log error with context
  console.error(`❌ Error [${req.method} ${req.path}]:`, err.message);
  if (env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  let error = {
    message: err.message || "Server Error",
    statusCode: err.statusCode || 500,
  };

  // ==========================================
  // MONGOOSE ERRORS
  // ==========================================

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = {
      message: "Resource not found",
      statusCode: 404,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "value";
    error = {
      message: `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } '${value}' already exists`,
      statusCode: 400,
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    error = {
      message: messages.join(". ") || "Validation Error",
      statusCode: 400,
    };
  }

  // ==========================================
  // JWT ERRORS
  // ==========================================

  if (err.name === "JsonWebTokenError") {
    error = {
      message: "Not authorized, invalid token",
      statusCode: 401,
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "Not authorized, token expired",
      statusCode: 401,
    };
  }

  // ==========================================
  // NETWORK/CONNECTION ERRORS
  // ==========================================

  // MongoDB network error
  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongooseServerSelectionError"
  ) {
    error = {
      message: "Database connection error. Please try again later.",
      statusCode: 503,
    };
  }

  // Timeout errors
  if (err.name === "MongoTimeoutError") {
    error = {
      message: "Request timed out. Please try again.",
      statusCode: 504,
    };
  }

  // ==========================================
  // REQUEST ERRORS
  // ==========================================

  // Bad JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = {
      message: "Invalid JSON in request body",
      statusCode: 400,
    };
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    error = {
      message: "Request payload too large",
      statusCode: 413,
    };
  }

  // ==========================================
  // SEND RESPONSE
  // ==========================================

  // Ensure we haven't already sent a response
  if (res.headersSent) {
    return next(err);
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    ...(env.NODE_ENV === "development" && {
      stack: err.stack,
      name: err.name,
    }),
  });
};

export default errorHandler;
