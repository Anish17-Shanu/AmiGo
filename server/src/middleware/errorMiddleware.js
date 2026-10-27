import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  } else if (err.name === "CastError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(", ") || "field"}`;
  } else if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Invalid or expired token";
  }

  logger.error(message, {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    stack: env.isProduction ? undefined : err.stack
  });

  res.status(statusCode).json({ success: false, message });
};
