import http from "http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { configureSockets } from "./sockets/index.js";
import { setSocketServer } from "./services/realtimeService.js";
import { logger } from "./config/logger.js";
import { bootstrapDataIfEmpty } from "./seed/bootstrapData.js";

const bootstrap = async () => {
  await connectDb();
  await bootstrapDataIfEmpty();

  const app = createApp();
  const server = http.createServer(app);
  const io = configureSockets(server);
  setSocketServer(io);

  server.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

bootstrap();
