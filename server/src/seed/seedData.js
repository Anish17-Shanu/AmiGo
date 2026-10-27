import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedDemoData } from "./demoData.js";

dotenv.config();

let memoryServer = null;

const useInMemory = async () => {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  return "in-memory MongoDB";
};

const connect = async () => {
  const configuredUri = process.env.MONGO_URI;

  if (configuredUri) {
    try {
      await mongoose.connect(configuredUri, { serverSelectionTimeoutMS: 8000 });
      return "configured MONGO_URI";
    } catch (error) {
      if (!/localhost|127\.0\.0\.1/.test(configuredUri)) throw error;
      return useInMemory();
    }
  }

  try {
    await mongoose.connect("mongodb://localhost:27017/amigo", {
      serverSelectionTimeoutMS: 2000
    });
    return "local MongoDB";
  } catch {
    return useInMemory();
  }
};

const run = async () => {
  const target = await connect();
  const stats = await seedDemoData({ reset: true });

  console.log(`Seeded ${target}`);
  console.log(`Products: ${stats.products}`);
  console.log(`Users: ${stats.users}`);
  console.log(`Orders: ${stats.orders}`);
  console.log(`Revenue: $${stats.revenue}`);
  console.log("Admin: admin@amigo.com / Admin@123");
  console.log("Customer: user@amigo.com / User@123");

  if (target === "in-memory MongoDB") {
    console.log("WARNING: in-memory database is discarded on exit. Set MONGO_URI to persist data.");
  }

  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

run().catch(async (error) => {
  console.error("Seeding failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) await memoryServer.stop().catch(() => {});
  process.exit(1);
});
