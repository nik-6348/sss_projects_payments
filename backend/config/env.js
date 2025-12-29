import dotenv from "dotenv";
dotenv.config();

export default {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  DOMAIN: process.env.DOMAIN,
  LOGIN_ROLE: process.env.LOGIN_ROLE,
  LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,

  // JWT_CONFIGS
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN,

  // WhatsApp Meta
  WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID,
  WA_ACCESS_TOKEN: process.env.WA_ACCESS_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
};
