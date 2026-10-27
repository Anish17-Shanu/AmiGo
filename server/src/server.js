import http from "http";
import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { configureSockets } from "./sockets/index.js";
import { setSocketServer } from "./services/realtimeService.js";
import { logger } from "./config/logger.js";
import { bootstrapDataIfEmpty } from "./seed/bootstrapData.js";

let server = null;
let io = null;

const bootstrap = async () => {
  await connectDb();
  await bootstrapDataIfEmpty();

  const app = createApp();
  server = http.createServer(app);
  io = configureSockets(server);
  setSocketServer(io);

  server.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down`);
  try {
    if (io) await new Promise((resolve) => io.close(resolve));
    if (server) {
      server.close();
      server.closeAllConnections?.();
    }
    await disconnectDb();
    process.exit(0);
  } catch (error) {
    logger.error("Graceful shutdown failed", { message: error.message });
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
  process.exit(1);
});

bootstrap().catch((error) => {
  logger.error("Failed to start server", { message: error.message, stack: error.stack });
  process.exit(1);
});
