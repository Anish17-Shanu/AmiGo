import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

let memoryServer = null;

export const connectDb = async () => {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: env.mongoConnectTimeoutMs });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    if (env.isProduction) {
      throw new Error(`MongoDB is unavailable: ${error.message}`);
    }

    logger.warn("MongoDB connection failed, switching to in-memory MongoDB", {
      message: error.message
    });
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    logger.info("Connected to in-memory MongoDB");
  }
};

export const disconnectDb = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

export const isDbReady = () => mongoose.connection.readyState === 1;
