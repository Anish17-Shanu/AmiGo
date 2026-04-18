import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env.js";
import { logger } from "./logger.js";

let memoryServer = null;

export const connectDb = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.warn("MongoDB connection failed, switching to in-memory MongoDB", { message: error.message });
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    logger.info("Connected to in-memory MongoDB");
  }
};
