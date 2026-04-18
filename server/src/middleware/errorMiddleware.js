import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger.js";

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  logger.error(err.message, { stack: err.stack, statusCode });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
};
