import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const jwtSecret =
  process.env.JWT_SECRET || (isProduction ? "" : "dev-only-secret-change-before-production");

if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/amigo",
  mongoConnectTimeoutMs: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 3000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrls,
  clientUrl: clientUrls[0],
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8000",
  analyticsTimeoutMs: Number(process.env.ANALYTICS_TIMEOUT_MS || 3000),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300)
};
