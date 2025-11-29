import jwt from "jsonwebtoken";
import env from "../config/env.js";

// Helper function to parse time duration strings (e.g., "1d", "30d", "24h")
const parseDurationToMs = (durationStr) => {
  if (!durationStr) return 30 * 24 * 60 * 60 * 1000; // Default 30 days

  const match = durationStr.match(/^(\d+)([dhms])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // Default fallback

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000; // days to milliseconds
    case "h":
      return value * 60 * 60 * 1000; // hours to milliseconds
    case "m":
      return value * 60 * 1000; // minutes to milliseconds
    case "s":
      return value * 1000; // seconds to milliseconds
    default:
      return 30 * 24 * 60 * 60 * 1000; // Default fallback
  }
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || "30d",
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

// Generate token response
const generateTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user.getJWTPayload());

  const options = {
    expires: new Date(Date.now() + parseDurationToMs(env.JWT_COOKIE_EXPIRE)),
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
};

export {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateTokenResponse,
};
