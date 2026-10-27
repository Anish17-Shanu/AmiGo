import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/User.js";

const ADMIN_ROOM = "admins";

const authenticateSocket = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("role");
    if (!user) return next(new Error("Unauthorized"));

    socket.data.userId = String(user._id);
    socket.data.isAdmin = user.role === "admin";
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
};

export const configureSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrls,
      methods: ["GET", "POST"]
    }
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`, { userId: socket.data.userId || "guest" });

    if (socket.data.userId) socket.join(`user:${socket.data.userId}`);
    if (socket.data.isAdmin) socket.join(ADMIN_ROOM);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
